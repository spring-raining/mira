import { nanoid } from 'nanoid/non-secure';
import {
  useRecoilState,
  useRecoilValue,
  useRecoilCallback,
  selector,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import {
  activeBrickIdState,
  asteroidDeclaredValueDictState,
  asteroidValuesExportedState,
  brickDictState,
  brickOrderState,
  Brick,
} from '../atoms';
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
  const pushBrick = useRecoilCallback(
    ({ set }) => async (newBrick: Brick) => {
      set(brickDictState, (brickDict) => ({...brickDict, [newBrick.brickId]: newBrick}));
      set(brickOrderState, (brickOrder) => [...brickOrder, newBrick.brickId]);
    }
  );
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

  const insertBrick = useRecoilCallback(
    ({ snapshot, set }) => async (newBrick: Brick, offset: number = 0) => {
      const brickDict = { ...(await snapshot.getPromise(brickDictState)) };
      const brickOrder = [...(await snapshot.getPromise(brickOrderState))];
      if (!brickOrder.includes(brickId)) {
        throw new Error('prependNewBrick failed');
      }
      brickDict[newBrick.brickId] = newBrick;
      brickOrder.splice(
        brickOrder.indexOf(brickId) + offset,
        0,
        newBrick.brickId
      );
      set(brickDictState, brickDict);
      set(brickOrderState, brickOrder);
    }
  );
  return {
    brick,
    updateBrick,
    insertBrick,
    isActive: brickId === activeBrickId,
  };
};

export const useBrickManipulator = () => {
  const cleanup = useRecoilCallback(
    ({ snapshot, set }) => async (brickId: string) => {
      const activeBrickId = await snapshot.getPromise(activeBrickIdState);
      const brickOrder = await snapshot.getPromise(brickOrderState);
      const brickDict = await snapshot.getPromise(brickDictState);
      const filterDict = <T>(dict: Record<string, T>, excludeKey: string[]) =>
        Object.entries(dict).reduce<Record<string, T>>(
          (prev, [k, v]) =>
            excludeKey.includes(k) ? prev : { ...prev, [k]: v },
          {}
        );
      if (brickOrder.includes(brickId)) {
        set(
          brickOrderState,
          brickOrder.filter((id) => id !== brickId)
        );
      }
      set(activeBrickIdState, activeBrickId === brickId ? null : activeBrickId);
      if (brickId in brickDict) {
        set(brickDictState, filterDict(brickDict, [brickId]));
      }
      delete editorRefs[brickId];
      const brick = brickDict[brickId];
      if (brick?.noteType === 'asteroid') {
        const asteroidId = brick.asteroid.id;
        const decalredValueDict = await snapshot.getPromise(
          asteroidDeclaredValueDictState
        );
        const exportedValues =
          (await snapshot.getPromise(asteroidValuesExportedState)) ?? [];
        set(
          asteroidDeclaredValueDictState,
          filterDict(decalredValueDict, exportedValues[asteroidId] ?? [])
        );
        set(
          asteroidValuesExportedState,
          filterDict(exportedValues, [asteroidId])
        );
      }
    }
  );

  return { cleanup };
};

export const createNewBrick = (noteType: Brick['noteType']): Brick => {
  const brick = {
    noteType,
    brickId: nanoid(),
    text: '',
    children: null,
  };
  if (brick.noteType === 'asteroid') {
    return { ...brick, asteroid: { id: nanoid() } };
  } else {
    return brick as Brick;
  }
};
