import {
  useRecoilCallback,
  useRecoilTransactionObserver_UNSTABLE,
  RecoilState,
} from 'recoil';
import {
  brickDictState,
  brickOrderState,
  activeBrickIdState,
} from '../state/atoms';
import { useHistoryRef } from './history/context';

const recordingAtoms: Readonly<RecoilState<any>[]> = [
  brickDictState,
  brickOrderState,
  activeBrickIdState,
] as const;

export const HistoryObserver = () => {
  const historyRef = useHistoryRef();
  useRecoilTransactionObserver_UNSTABLE(({ snapshot }) => {
    const prev = historyRef.current.stack;
    const purged = prev.slice(prev.length - 1);
    historyRef.current.stack = [
      ...prev.slice(0, prev.length - 1),
      {
        snapshot,
        release: snapshot.retain(),
      },
    ];
    purged.forEach(({ release }) => release());
  });
  return null;
};

export const useHistory = () => {
  const historyRef = useHistoryRef();

  const commit = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const { stack, depth } = historyRef.current;
        const purged = stack.slice(depth + 1);
        historyRef.current = {
          stack: [
            ...stack.slice(0, depth + 1),
            {
              snapshot,
              release: snapshot.retain(),
            },
          ],
          depth: depth + 1,
        };
        purged.forEach(({ release }) => release());
      },
    [],
  );

  const restore = useRecoilCallback(
    ({ snapshot, gotoSnapshot }) =>
      async (step: number) => {
        const { stack, depth } = historyRef.current;
        if (depth + step < 0 || depth + step >= stack.length - 1) {
          return;
        }
        const restoreSnapshot = stack[depth + step].snapshot;
        const newSnapshot = await snapshot.asyncMap(async ({ set }) => {
          for (const state of recordingAtoms) {
            const val = await restoreSnapshot.getPromise(state);
            set(state, val);
          }
        });
        historyRef.current = {
          stack:
            depth < stack.length - 1
              ? stack
              : [...stack, { snapshot, release: snapshot.retain() }],
          depth: depth + step,
        };
        gotoSnapshot(newSnapshot);
      },
    [],
  );

  return { commit, restore };
};
