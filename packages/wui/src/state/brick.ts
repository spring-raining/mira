import { nanoid } from 'nanoid/non-secure';
import { useEffect } from 'react';
import {
  useRecoilValue,
  useRecoilCallback,
  useRecoilState,
  selector,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import { dehydrateBrick } from '../mdx/io';
import { updateBrickByText, updateBrickLanguage } from '../mdx/update';
import { Brick } from '../types';
import { cancellable, debounce } from '../util';
import {
  activeBrickIdState,
  focusedBrickIdState,
  inViewBrickIdsState,
  selectedBrickIdsState,
  brickDictState,
  brickOrderState,
  brickSyntaxErrorState,
  brickModuleImportErrorState,
} from './atoms';
import { editorRefs } from './editor';

const transpiledMdxCache = new WeakMap<Brick, string>();

export const brickStateFamily = selectorFamily<Brick, string>({
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

const brickSyntaxErrorStateFamily = selectorFamily<
  { error: Error; parsedText: string } | undefined,
  string
>({
  key: 'brickSyntaxErrorStateFamily',
  get: (brickId) => ({ get }) => get(brickSyntaxErrorState)[brickId],
  set: (brickId) => ({ set }, newValue) => {
    if (!(newValue instanceof DefaultValue)) {
      set(brickSyntaxErrorState, (prevState) => {
        const state = { ...prevState };
        if (newValue) {
          state[brickId] = newValue;
        } else {
          delete state[brickId];
        }
        return state;
      });
    }
  },
});

const brickModuleImportErrorStateFamily = selectorFamily<
  Error | undefined,
  string
>({
  key: 'brickModuleImportErrorStateFamily',
  get: (brickId) => ({ get }) => get(brickModuleImportErrorState)[brickId],
});

const bricksState = selector({
  key: 'bricksState',
  get: ({ get }) =>
    get(brickOrderState)
      .map((brickId) => get(brickDictState)[brickId])
      .filter((brick) => !!brick),
});

export const useBricks = ({
  onUpdateMdx = () => {},
}: {
  onUpdateMdx?: (mdx: string) => void;
} = {}) => {
  const bricks = useRecoilValue(bricksState);
  const [selectedBrickIds, setSelectedBrickIds] = useRecoilState(
    selectedBrickIdsState
  );
  const pushBrick = useRecoilCallback(({ set }) => async (newBrick: Brick) => {
    set(brickDictState, (brickDict) => ({
      ...brickDict,
      [newBrick.id]: newBrick,
    }));
    set(brickOrderState, (brickOrder) => [...brickOrder, newBrick.id]);
  });
  const flushAll = useRecoilCallback(({ reset }) => () => {
    reset(activeBrickIdState);
    reset(focusedBrickIdState);
    reset(inViewBrickIdsState);
    reset(selectedBrickIdsState);
    reset(brickOrderState);
    reset(brickDictState);
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
    reset(selectedBrickIdsState);
  });
  const updateBrickOrder = useRecoilCallback(
    ({ set }) => (newBrickOrder: string[]) => {
      set(brickOrderState, newBrickOrder);
    }
  );

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

  return {
    bricks,
    selectedBrickIds,
    pushBrick,
    flushAll,
    importBricks,
    resetActiveBrick,
    updateBrickOrder,
    setSelectedBrickIds,
  };
};

export const useBrick = (brickId: string) => {
  const brick = useRecoilValue(brickStateFamily(brickId));
  const brickSyntaxError = useRecoilValue(brickSyntaxErrorStateFamily(brickId));
  const brickModuleImportError = useRecoilValue(
    brickModuleImportErrorStateFamily(brickId)
  );
  const activeBrickId = useRecoilValue(activeBrickIdState);
  const focusedBrickId = useRecoilValue(focusedBrickIdState);
  const selectedBrickIds = useRecoilValue(selectedBrickIdsState);
  const setActive = useRecoilCallback(({ set }) => () => {
    set(activeBrickIdState, brickId);
  });
  const setFocused = useRecoilCallback(({ set }) => (isFocused: boolean) => {
    set(focusedBrickIdState, (current) =>
      isFocused ? brickId : current === brickId ? null : current
    );
  });
  const updateBrick = useRecoilCallback(
    ({ set, snapshot }) =>
      debounce(({ hasCancelled }) => async (text: string) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        const { newBrick, syntaxError } = updateBrickByText(brick, text);
        if (hasCancelled()) {
          return;
        }
        if (syntaxError) {
          set(brickSyntaxErrorStateFamily(brickId), {
            error: syntaxError,
            parsedText: text,
          });
        } else {
          set(brickSyntaxErrorStateFamily(brickId), undefined);
        }
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.id]: brick,
              }),
              {}
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.id),
              1,
              ...newBrick.map(({ id }) => id)
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
        if (brick.type !== 'snippet') {
          return;
        }
        const { newBrick, syntaxError } = updateBrickLanguage(brick, language);
        if (hasCancelled()) {
          return;
        }
        if (syntaxError) {
          set(brickSyntaxErrorStateFamily(brickId), {
            error: syntaxError,
            parsedText: brick.text,
          });
        } else {
          set(brickSyntaxErrorStateFamily(brickId), undefined);
        }
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.id]: brick,
              }),
              {}
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.id),
              1,
              ...newBrick.map(({ id }) => id)
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
    syntaxError: brickSyntaxError,
    moduleImportError: brickModuleImportError,
    updateBrick,
    updateLanguage,
    isActive: brickId === activeBrickId,
    isFocused: brickId === focusedBrickId,
    isSelected: selectedBrickIds.includes(brickId),
    setActive,
    setFocused,
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
      brickDict[newBrick.id] = newBrick;
      brickOrder.splice(
        (targetBrickId ? brickOrder.indexOf(targetBrickId) : 0) + offset,
        0,
        newBrick.id
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
    }
  );

  return { insertBrick, cleanup };
};

export const useInViewBrickState = () => {
  const inViewBrickIds = useRecoilValue(inViewBrickIdsState);
  const updateInViewState = useRecoilCallback(
    ({ set }) => (brickId: string, inView: boolean) => {
      // console.log(brickId, inView);
      set(inViewBrickIdsState, (ids) => {
        const includes = ids.includes(brickId);
        return inView && !includes
          ? [...ids, brickId]
          : !inView && includes
          ? ids.filter((id) => id !== brickId)
          : ids;
      });
    }
  );

  return {
    inViewBrickIds,
    updateInViewState,
  };
};

export const createNewBrick = ({
  type,
  language,
  isLived,
}: {
  type: Brick['type'];
  language?: string;
  isLived?: boolean;
}): Brick => {
  if (type === 'snippet') {
    return {
      id: nanoid(),
      type,
      language: language ?? '',
      text: '',
      children: null,
      ...(isLived && {
        mira: {
          id: nanoid(),
          isLived,
        },
      }),
    };
  }
  return {
    id: nanoid(),
    type,
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
