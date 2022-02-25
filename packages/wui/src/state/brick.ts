import { useEffect } from 'react';
import {
  useRecoilValue,
  useRecoilCallback,
  useRecoilState,
  selector,
  selectorFamily,
} from 'recoil';
import { dehydrateBrick } from '../mdx/io';
import { updateBrickByText, updateBrickTrait } from '../mdx/update';
import { Brick, BrickId } from '../types';
import { cancellable, genBrickId, genMiraId, noop } from '../util';
import {
  activeBrickIdState,
  focusedBrickIdState,
  selectedBrickIdsState,
  brickDictState,
  brickOrderState,
  brickParseErrorState,
  brickModuleImportErrorState,
  brickTextSwapState,
  evaluatePausedState,
} from './atoms';

const transpiledMdxCache = new WeakMap<Brick, string>();

export const brickStateFamily = getDictItemSelector({
  key: 'brickStateFamily',
  state: brickDictState,
});

const brickParseErrorStateFamily = getDictItemSelector({
  key: 'brickParseErrorStateFamily',
  state: brickParseErrorState,
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

const literalBrickDataFamily = selectorFamily({
  key: 'literalBrickDataFamily',
  get:
    (brickId: BrickId) =>
    ({ get }) => {
      const brick = get(brickStateFamily(brickId));
      const swap = get(brickTextSwapStateFamily(brickId));
      return (
        swap ||
        (brick && {
          text: brick.text,
          ...(brick.type === 'snippet' && brick.mira
            ? { mira: brick.mira }
            : {}),
        })
      );
    },
});

import { editorRefs } from './editor';
import { getDictItemSelector } from './helper';

export const useBricks = ({
  onUpdateMdx = noop,
}: {
  onUpdateMdx?: (mdx: string) => void;
} = {}) => {
  const bricks = useRecoilValue(bricksState);
  const brickOrder = useRecoilValue(brickOrderState);
  const [selectedBrickIds, setSelectedBrickIds] = useRecoilState(
    selectedBrickIdsState,
  );
  const [evaluatePaused, setEvaluatePaused] =
    useRecoilState(evaluatePausedState);
  const pushBrick = useRecoilCallback(
    ({ set }) =>
      async (newBrick: Brick) => {
        set(brickDictState, (brickDict) => ({
          ...brickDict,
          [newBrick.id]: newBrick,
        }));
        set(brickOrderState, (brickOrder) => [...brickOrder, newBrick.id]);
      },
    [],
  );
  const flushAll = useRecoilCallback(
    ({ reset }) =>
      () => {
        reset(activeBrickIdState);
        reset(focusedBrickIdState);
        reset(selectedBrickIdsState);
        reset(brickOrderState);
        reset(brickDictState);
        reset(brickTextSwapState);
      },
    [],
  );
  const importBricks = useRecoilCallback(
    ({ set }) =>
      async (bricks: Brick[]) => {
        // wait for setting evaluatePausedState to effect before updating bricks
        await setEvaluatePaused(true);
        await flushAll();
        await set(
          brickDictState,
          bricks.reduce(
            (acc, brick) => ({
              ...acc,
              [brick.id]: brick,
            }),
            {},
          ),
        );
        await set(
          brickOrderState,
          bricks.map(({ id }) => id),
        );
        await setEvaluatePaused(false);
      },
    [flushAll],
  );
  const resetActiveBrick = useRecoilCallback(
    ({ reset }) =>
      () => {
        reset(activeBrickIdState);
        reset(selectedBrickIdsState);
      },
    [],
  );
  const updateBrickOrder = useRecoilCallback(
    ({ set }) =>
      (newBrickOrder: BrickId[]) => {
        set(brickOrderState, newBrickOrder);
      },
    [],
  );

  useEffect(
    () =>
      cancellable(() => {
        if (evaluatePaused) {
          return;
        }
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
    [bricks, onUpdateMdx, evaluatePaused],
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

export const useBrick = (brickId: BrickId) => {
  const brick = useRecoilValue(brickStateFamily(brickId));
  const brickParseError = useRecoilValue(brickParseErrorStateFamily(brickId));
  const brickModuleImportError = useRecoilValue(
    brickModuleImportErrorStateFamily(brickId),
  );
  const activeBrickId = useRecoilValue(activeBrickIdState);
  const focusedBrickId = useRecoilValue(focusedBrickIdState);
  const selectedBrickIds = useRecoilValue(selectedBrickIdsState);
  const swap = useRecoilValue(brickTextSwapStateFamily(brickId));
  const literalBrickData = useRecoilValue(literalBrickDataFamily(brickId));
  const setActive = useRecoilCallback(
    ({ set }) =>
      () => {
        set(activeBrickIdState, brickId);
      },
    [brickId],
  );
  const setFocused = useRecoilCallback(
    ({ set }) =>
      (isFocused: boolean) => {
        set(focusedBrickIdState, (current) =>
          isFocused ? brickId : current === brickId ? null : current,
        );
      },
    [brickId],
  );
  const updateText = useRecoilCallback(
    ({ set, snapshot }) =>
      async (text: string) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        if (!brick) {
          return;
        }
        const { newBrick, syntaxError } = updateBrickByText(brick, text);
        set(brickParseErrorState, (prev) => ({
          ...prev,
          [brickId]: syntaxError
            ? {
                error: syntaxError,
                parsedText: text,
              }
            : undefined,
        }));
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.id]: brick,
              }),
              {},
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.id),
              1,
              ...newBrick.map(({ id }) => id),
            );
            return arr;
          });
        } else {
          set(brickStateFamily(brickId), newBrick);
        }
      },
    [brickId],
  );
  const updateTrait = useRecoilCallback(
    ({ set, snapshot }) =>
      async (trait: { type?: Brick['type']; language?: string }) => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        if (!brick) {
          return;
        }
        const { newBrick, syntaxError } = updateBrickTrait(brick, trait);
        set(brickParseErrorState, (prev) => ({
          ...prev,
          [brickId]: syntaxError
            ? {
                error: syntaxError,
                parsedText: brick.text,
              }
            : undefined,
        }));
        if (Array.isArray(newBrick)) {
          set(brickDictState, (prevState) => ({
            ...prevState,
            ...newBrick.reduce(
              (acc, brick) => ({
                ...acc,
                [brick.id]: brick,
              }),
              {},
            ),
          }));
          set(brickOrderState, (prevState) => {
            const arr = [...prevState];
            arr.splice(
              prevState.indexOf(brick.id),
              1,
              ...newBrick.map(({ id }) => id),
            );
            return arr;
          });
        } else {
          set(brickStateFamily(brickId), newBrick);
        }
      },
    [brickId],
  );
  const setSwap = useRecoilCallback(
    ({ snapshot, set }) =>
      async (text: string | undefined) => {
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
                        id: genMiraId(),
                      }
                    : undefined,
                }
              : undefined,
        }));
      },
    [brickId],
  );
  const applySwap = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        const brick = await snapshot.getPromise(brickStateFamily(brickId));
        const swap = await snapshot.getPromise(
          brickTextSwapStateFamily(brickId),
        );
        set(brickTextSwapStateFamily(brickId), undefined);
        if (!brick || !swap || brick.text === swap.text) {
          return;
        }
        updateText(swap.text);
      },
    [brickId, updateText],
  );

  return {
    brick: brick!,
    parseError: brickParseError,
    moduleImportError: brickModuleImportError,
    swap,
    literalBrickData,
    updateText,
    updateTrait,
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
    ({ snapshot, set }) =>
      async ({
        newBrick,
        targetBrickId,
        offset = 0,
      }: {
        newBrick: Brick;
        targetBrickId?: BrickId;
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
          newBrick.id,
        );
        set(brickDictState, brickDict);
        set(brickOrderState, brickOrder);
      },
    [],
  );

  const cleanup = useRecoilCallback(
    ({ set }) =>
      async (brickId: BrickId) => {
        set(brickOrderState, (brickOrder) =>
          brickOrder.filter((id) => id !== brickId),
        );
        set(activeBrickIdState, (activeBrickId) =>
          activeBrickId === brickId ? null : activeBrickId,
        );
        set(brickStateFamily(brickId), undefined);
        set(brickTextSwapStateFamily(brickId), undefined);
        delete editorRefs[brickId];
      },
    [],
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
      id: genBrickId(),
      type,
      language: language ?? '',
      text: '',
      children: null,
      ...(isLived && {
        mira: {
          id: genMiraId(),
          isLived,
        },
      }),
    };
  }
  return {
    id: genBrickId(),
    type,
    text: '',
    children: null,
    ...(isLived && {
      mira: {
        id: genMiraId(),
        isLived,
      },
    }),
  };
};
