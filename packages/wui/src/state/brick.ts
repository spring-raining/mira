import { nanoid } from 'nanoid/non-secure';
import {
  useRecoilState,
  useRecoilValue,
  useRecoilCallback,
  selector,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import { Brick } from '../types';
import {
  activeBrickIdState,
  asteroidDeclaredValueDictState,
  asteroidValuesExportedState,
  brickDictState,
  brickOrderState,
} from './atoms';
import { editorRefs } from './editor';

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

export const useBricks = () => {
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
    reset(asteroidDeclaredValueDictState);
    reset(asteroidValuesExportedState);
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
  return { bricks, pushBrick, flushAll, importBricks };
};

export const useBrick = (brickId: string) => {
  const [brick, updateBrick] = useRecoilState(brickStateFamily(brickId));
  const [activeBrickId] = useRecoilState(activeBrickIdState);
  const focus = useRecoilCallback(({ set }) => () => {
    set(activeBrickIdState, brickId);
  });
  return {
    brick,
    updateBrick,
    isActive: brickId === activeBrickId,
    focus,
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
      set(
        brickOrderState,
        (brickOrder) => brickOrder.filter((id) => id !== brickId)
      );
      set(
        activeBrickIdState,
        (activeBrickId) => activeBrickId === brickId ? null : activeBrickId
      );
      set(brickDictState, (brickDict) => filterDict(brickDict, [brickId]));
      delete editorRefs[brickId];
      const brick = brickDict[brickId];
      if (brick?.noteType === 'content' && brick?.asteroid) {
        const asteroidId = brick.asteroid.id;
        const exportedValues =
          (await snapshot.getPromise(asteroidValuesExportedState)) ?? [];
        set(
          asteroidDeclaredValueDictState,
          (decalredValueDict) => filterDict(decalredValueDict, exportedValues[asteroidId] ?? [])
        );
        set(
          asteroidValuesExportedState,
          (exportedValues) => filterDict(exportedValues ?? [], [asteroidId])
        );
      }
    }
  );

  return { insertBrick, cleanup };
};

export const createNewBrick = ({language, isLived}: {language: string; isLived?: boolean}): Brick => {
  return {
    brickId: nanoid(),
    noteType: 'content',
    language,
    text: '',
    children: null,
    ...(isLived && {
      asteroid: {
        id: nanoid(),
        isLived,
      },
    }),
  };
};