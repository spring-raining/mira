import { useEffect, useRef } from 'react';
import {
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
  RecoilState,
  RecoilValue,
} from 'recoil';
import {
  brickDictState,
  brickOrderState,
  activeBrickIdState,
} from '../state/atoms';
import { useHistoryRef } from './history/context';
import { useDebouncedCallback } from './useDebouncedCallback';

const recordingAtoms: Readonly<RecoilState<any>[]> = [
  brickDictState,
  brickOrderState,
  activeBrickIdState,
] as const;

const watchingAtoms: Readonly<RecoilValue<any>[]> = [
  brickDictState,
  brickOrderState,
] as const;

export const useHistory = () => {
  const historyRef = useHistoryRef();

  const effect = useRecoilCallback(
    ({ snapshot }) =>
      () => {
        const { history } = historyRef.current;
        history.release?.();
        const release = snapshot.retain();
        const newHistory = {
          id: history.id,
          snapshot,
          release,
          prev: history.prev,
          next: history.next,
        };
        if (history.prev) {
          history.prev.next = newHistory;
        }
        if (history.next) {
          history.next.prev = newHistory;
        }
        historyRef.current.history = newHistory;
      },
    [historyRef],
  );

  const _commit = useRecoilCallback(
    ({ snapshot }) =>
      () => {
        try {
          const { history } = historyRef.current;
          // Release all history linked to next
          for (let next = history.next; next; next = next.next) {
            next.release?.();
          }
          const release = snapshot.retain();
          historyRef.current.history = history.next = {
            id: history.id + 1,
            snapshot,
            release,
            prev: history,
          };
        } finally {
          historyRef.current.isInCommit = false;
        }
      },
    [historyRef],
  );
  const commit = useDebouncedCallback(_commit, 500);

  const restore = useRecoilCallback(
    ({ snapshot, gotoSnapshot }) =>
      async (side: 'undo' | 'redo') => {
        historyRef.current.isInRestore = true;
        const release = snapshot.retain();
        try {
          const { history } = historyRef.current;
          const restoreHistory = side === 'undo' ? history.prev : history.next;
          const restoreSnapshot = restoreHistory?.snapshot;
          if (!restoreSnapshot) {
            return;
          }
          const newSnapshot = await snapshot.asyncMap(async ({ set }) => {
            for (const state of recordingAtoms) {
              const val = await restoreSnapshot.getPromise(state);
              set(state, val);
            }
          });
          historyRef.current.history = restoreHistory;
          historyRef.current.restoreSnapshotId = newSnapshot.getID();
          gotoSnapshot(newSnapshot);
        } finally {
          release();
          historyRef.current.isInRestore = false;
        }
      },
    [historyRef],
  );

  return {
    effect,
    commit,
    undo: () => restore('undo'),
    redo: () => restore('redo'),
  };
};

export const HistoryObserver = () => {
  const historyRef = useHistoryRef();
  const { effect, commit } = useHistory();

  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  const effectRef = useRef(effect);
  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  useRecoilTransactionObserver_UNSTABLE(({ snapshot }) => {
    if (!historyRef.current.history.snapshot) {
      commitRef.current();
      return;
    }
    if (historyRef.current.restoreSnapshotId === snapshot.getID()) {
      historyRef.current.restoreSnapshotId = null;
      return;
    }
    if (historyRef.current.isInRestore) {
      return;
    }

    for (const node of snapshot.getNodes_UNSTABLE({ isModified: true })) {
      if (watchingAtoms.map((v) => v.key).includes(node.key)) {
        historyRef.current.isInCommit = true;
        commitRef.current();
        break;
      }
    }
    if (!historyRef.current.isInCommit) {
      effectRef.current();
    }
  });

  return null;
};
