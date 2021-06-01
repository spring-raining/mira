import { nanoid } from 'nanoid/non-secure';
import { useEffect } from 'react';
import {
  useRecoilState,
  useRecoilValue,
  useRecoilCallback,
  selector,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import { dehydrateBrick } from '../mdx/io';
import { updateBrickByText, updateBrickLanguage } from '../mdx/update';
import { Brick } from '../types';
import {
  activeBrickIdState,
  miraDeclaredValueDictState,
  miraValuesExportedState,
  miraImportErrorDictState,
  brickDictState,
  brickOrderState,
} from './atoms';
import { editorRefs } from './editor';

const transpiledMdxCache = new WeakMap<Brick, string>();

const brickStateFamily = selectorFamily<Brick, string>({
  key: 'brickStateFamily',
  get: (brickId) => ({ get }) => get(brickDictState)[brickId],
  set: (brickId) => ({ set }, newValue) => {
    if (!(newValue instanceof DefaultValue)) {
      set(brickDictState, (prevState) => ({
        ...prevState,
        [brickId]: newValue,
      }));
    }
  },
});

const bricksState = selector({
  key: 'bricksState',
  get: ({ get }) =>
    get(brickOrderState)
      .map((brickId) => get(brickDictState)[brickId])
      .filter((brick) => !!brick),
});

const miraImportErrorStateFamily = selectorFamily<
  Error | null,
  Brick['brickId']
>({
  key: 'miraImportErrorStateFamily',
  get: (brickId) => ({ get }) => get(miraImportErrorDictState)[brickId] ?? null,
});

const cancellable = (fn: () => void, ms = 100) => {
  const timer = setTimeout(fn, ms);
  return () => {
    clearTimeout(timer);
  };
};
const debounce = <T extends unknown[]>(
  fn: (timer: { hasCancelled: () => boolean }) => (...args: T) => void,
  ms = 100
) => {
  let cancel: () => void;
  return (...args: T) => {
    let cancelled = false;
    const hasCancelled = () => cancelled;
    cancel?.();
    const cancelFn = cancellable(() => fn({ hasCancelled })(...args), ms);
    cancel = () => {
      cancelled = true;
      cancelFn();
    };
  };
};

export const useBricks = ({
  onUpdateMdx = () => {},
}: {
  onUpdateMdx?: (mdx: string) => void;
} = {}) => {
  const bricks = useRecoilValue(bricksState);
  const pushBrick = useRecoilCallback(({ set }) => async (newBrick: Brick) => {
    set(brickDictState, (brickDict) => ({
      ...brickDict,
      [newBrick.brickId]: newBrick,
    }));
    set(brickOrderState, (brickOrder) => [...brickOrder, newBrick.brickId]);
  });
  const flushAll = useRecoilCallback(({ reset }) => () => {
    reset(activeBrickIdState);
    reset(brickOrderState);
    reset(brickDictState);
    reset(miraDeclaredValueDictState);
    reset(miraValuesExportedState);
  });
  const importBricks = useRecoilCallback(
    () => async (bricks: Brick[]) => {
      flushAll();
      for (let brick of bricks) {
        await pushBrick(brick);
      }
    },
    [flushAll, pushBrick]
  );
  const resetActiveBrick = useRecoilCallback(({ reset }) => () => {
    reset(activeBrickIdState);
  });

  useEffect(
    () =>
      cancellable(() => {
        const mdx = bricks
          .map((brick) => {
            if (transpiledMdxCache.has(brick)) {
              return transpiledMdxCache.get(brick)!;
            }
            return dehydrateBrick(brick);
          })
          .join('\n');
        onUpdateMdx(mdx);
      }),
    [bricks, onUpdateMdx]
  );

  return { bricks, pushBrick, flushAll, importBricks, resetActiveBrick };
};

export const useBrick = (brickId: string) => {
  const [brick] = useRecoilState(brickStateFamily(brickId));
  const [activeBrickId] = useRecoilState(activeBrickIdState);
  const importError = useRecoilValue(miraImportErrorStateFamily(brickId));
  const setActive = useRecoilCallback(({ set }) => () => {
    set(activeBrickIdState, brickId);
  });
  const updateBrick = useRecoilCallback(
    ({ set, snapshot }) =>
      debounce(({ hasCancelled }) => async (text: string) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        const newBrick = updateBrickByText(brick, text);
        if (hasCancelled()) {
          return;
        }
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.brickId]: brick,
              }),
              {}
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.brickId),
              1,
              ...newBrick.map(({ brickId }) => brickId)
            );
            return arr;
          });
        } else {
          set(brickStateFamily(brickId), newBrick);
        }
      }),
    [brickId]
  );
  const updateLanguage = useRecoilCallback(
    ({ set, snapshot }) =>
      debounce(({ hasCancelled }) => async (language: string) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        if (brick.noteType !== 'content') {
          return;
        }
        const newBrick = updateBrickLanguage(brick, language);
        if (hasCancelled()) {
          return;
        }
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.brickId]: brick,
              }),
              {}
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.brickId),
              1,
              ...newBrick.map(({ brickId }) => brickId)
            );
            return arr;
          });
        } else {
          set(brickStateFamily(brickId), newBrick);
        }
      }),
    [brickId]
  );

  return {
    brick,
    updateBrick,
    updateLanguage,
    isActive: brickId === activeBrickId,
    setActive,
    importError,
  };
};

export const useBrickManipulator = () => {
  const insertBrick = useRecoilCallback(
    ({ snapshot, set }) => async ({
      newBrick,
      targetBrickId,
      offset = 0,
    }: {
      newBrick: Brick;
      targetBrickId?: string;
      offset?: number;
    }) => {
      const brickDict = { ...(await snapshot.getPromise(brickDictState)) };
      const brickOrder = [...(await snapshot.getPromise(brickOrderState))];
      if (targetBrickId && !brickOrder.includes(targetBrickId)) {
        throw new Error('target brick not found');
      }
      brickDict[newBrick.brickId] = newBrick;
      brickOrder.splice(
        (targetBrickId ? brickOrder.indexOf(targetBrickId) : 0) + offset,
        0,
        newBrick.brickId
      );
      set(brickDictState, brickDict);
      set(brickOrderState, brickOrder);
    }
  );

  const cleanup = useRecoilCallback(
    ({ snapshot, set }) => async (brickId: string) => {
      const brickDict = await snapshot.getPromise(brickDictState);
      const filterDict = <T>(dict: Record<string, T>, excludeKey: string[]) =>
        Object.entries(dict).reduce<Record<string, T>>(
          (prev, [k, v]) =>
            excludeKey.includes(k) ? prev : { ...prev, [k]: v },
          {}
        );
      set(brickOrderState, (brickOrder) =>
        brickOrder.filter((id) => id !== brickId)
      );
      set(activeBrickIdState, (activeBrickId) =>
        activeBrickId === brickId ? null : activeBrickId
      );
      set(brickDictState, (brickDict) => filterDict(brickDict, [brickId]));
      delete editorRefs[brickId];
      const brick = brickDict[brickId];
      if (brick?.noteType === 'content' && brick?.mira) {
        const miraId = brick.mira.id;
        const exportedValues =
          (await snapshot.getPromise(miraValuesExportedState)) ?? [];
        set(miraDeclaredValueDictState, (declaredValueDict) =>
          filterDict(declaredValueDict, exportedValues[miraId] ?? [])
        );
        set(miraValuesExportedState, (exportedValues) =>
          filterDict(exportedValues ?? [], [miraId])
        );
      }
    }
  );

  return { insertBrick, cleanup };
};

export const createNewBrick = ({
  language,
  isLived,
}: {
  language: string;
  isLived?: boolean;
}): Brick => {
  return {
    brickId: nanoid(),
    noteType: 'content',
    language,
    text: '',
    children: null,
    ...(isLived && {
      mira: {
        id: nanoid(),
        isLived,
      },
    }),
  };
};
