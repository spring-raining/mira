import { nanoid } from 'nanoid/non-secure';
import { useEffect } from 'react';
import {
  useRecoilValue,
  useRecoilCallback,
  useRecoilState,
  selector,
} from 'recoil';
import { dehydrateBrick } from '../mdx/io';
import { updateBrickByText, updateBrickLanguage } from '../mdx/update';
import { Brick } from '../types';
import { cancellable, debounce } from '../util';
import {
  activeBrickIdState,
  focusedBrickIdState,
  selectedBrickIdsState,
  brickDictState,
  brickOrderState,
  brickSyntaxErrorState,
  brickModuleImportErrorState,
  brickTextSwapState,
} from './atoms';
import { editorRefs } from './editor';
import { getDictItemSelector } from './helper';

const transpiledMdxCache = new WeakMap<Brick, string>();

export const brickStateFamily = getDictItemSelector({
  key: 'brickStateFamily',
  state: brickDictState,
});

const brickSyntaxErrorStateFamily = getDictItemSelector({
  key: 'brickSyntaxErrorStateFamily',
  state: brickSyntaxErrorState,
});

const brickModuleImportErrorStateFamily = getDictItemSelector({
  key: 'brickModuleImportErrorStateFamily',
  state: brickModuleImportErrorState,
});

const brickTextSwapStateFamily = getDictItemSelector({
  key: 'brickTextSwapStateFamily',
  state: brickTextSwapState,
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
  const brickOrder = useRecoilValue(brickOrderState);
  const [selectedBrickIds, setSelectedBrickIds] = useRecoilState(
    selectedBrickIdsState
  );
  const pushBrick = useRecoilCallback(
    ({ set }) => async (newBrick: Brick) => {
      set(brickDictState, (brickDict) => ({
        ...brickDict,
        [newBrick.id]: newBrick,
      }));
      set(brickOrderState, (brickOrder) => [...brickOrder, newBrick.id]);
    },
    []
  );
  const flushAll = useRecoilCallback(
    ({ reset }) => () => {
      reset(activeBrickIdState);
      reset(focusedBrickIdState);
      reset(selectedBrickIdsState);
      reset(brickOrderState);
      reset(brickDictState);
      reset(brickTextSwapState);
    },
    []
  );
  const importBricks = useRecoilCallback(
    ({ set }) => async (bricks: Brick[]) => {
      flushAll();
      set(
        brickDictState,
        bricks.reduce(
          (acc, brick) => ({
            ...acc,
            [brick.id]: brick,
          }),
          {}
        )
      );
      set(
        brickOrderState,
        bricks.map(({ id }) => id)
      );
    },
    [flushAll]
  );
  const resetActiveBrick = useRecoilCallback(
    ({ reset }) => () => {
      reset(activeBrickIdState);
      reset(selectedBrickIdsState);
    },
    []
  );
  const updateBrickOrder = useRecoilCallback(
    ({ set }) => (newBrickOrder: string[]) => {
      set(brickOrderState, newBrickOrder);
    },
    []
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
    brickOrder,
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
  const swap = useRecoilValue(brickTextSwapStateFamily(brickId));
  const setActive = useRecoilCallback(
    ({ set }) => () => {
      set(activeBrickIdState, brickId);
    },
    [brickId]
  );
  const setFocused = useRecoilCallback(
    ({ set }) => (isFocused: boolean) => {
      set(focusedBrickIdState, (current) =>
        isFocused ? brickId : current === brickId ? null : current
      );
    },
    [brickId]
  );
  const updateBrick = useRecoilCallback(
    ({ set, snapshot }) =>
      debounce(({ hasCancelled }) => async (text: string) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        if (!brick) {
          return;
        }
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
        if (!brick || brick.type !== 'snippet') {
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
  const setSwap = useRecoilCallback(
    ({ snapshot, set }) => async (text: string | undefined) => {
      const brick = await snapshot.getPromise(brickStateFamily(brickId));
      const mira = brick?.type === 'snippet' && brick.mira;
      set(brickTextSwapState, (state) => ({
        ...state,
        [brickId]:
          typeof text === 'string'
            ? {
                text,
                mira: mira
                  ? {
                      ...mira,
                      id: nanoid(),
                    }
                  : undefined,
              }
            : undefined,
      }));
    },
    [brickId]
  );
  const applySwap = useRecoilCallback(
    ({ snapshot, set }) => async () => {
      const brick = await snapshot.getPromise(brickStateFamily(brickId));
      const swap = await snapshot.getPromise(brickTextSwapStateFamily(brickId));
      set(brickTextSwapStateFamily(brickId), undefined);
      if (!brick || !swap || brick.text === swap.text) {
        return;
      }
      updateBrick(swap.text);
    },
    [brickId, updateBrick]
  );

  return {
    brick: brick!,
    syntaxError: brickSyntaxError,
    moduleImportError: brickModuleImportError,
    swap,
    updateBrick,
    updateLanguage,
    isActive: brickId === activeBrickId,
    isFocused: brickId === focusedBrickId,
    isSelected: selectedBrickIds.includes(brickId),
    setActive,
    setFocused,
    setSwap,
    applySwap,
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
    },
    []
  );

  const cleanup = useRecoilCallback(
    ({ snapshot, set }) => async (brickId: string) => {
      set(brickOrderState, (brickOrder) =>
        brickOrder.filter((id) => id !== brickId)
      );
      set(activeBrickIdState, (activeBrickId) =>
        activeBrickId === brickId ? null : activeBrickId
      );
      set(brickStateFamily(brickId), undefined);
      set(brickTextSwapStateFamily(brickId), undefined);
      delete editorRefs[brickId];
    },
    []
  );

  return { insertBrick, cleanup };
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
