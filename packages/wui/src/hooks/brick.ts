import { nanoid } from 'nanoid';
import {
  useRecoilState,
  useRecoilValue,
  useRecoilCallback,
  selector,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import { brickDictState, brickOrderState, Brick } from '../atoms';

const brickStateFamily = selectorFamily<Brick, string>({
  key: 'brickStateFamily',
  get: (brickId) => ({ get }) => get(brickDictState)[brickId],
  set: (brickId) => ({ set }, newValue) => {
    if (!(newValue instanceof DefaultValue)) {
      set(brickDictState, (prevState) => ({ ...prevState, [brickId]: newValue }));
    }
  },
});

const bricksState = selector({
  key: 'bricksState',
  get: ({ get }) =>
    get(brickOrderState).map((brickId) => get(brickDictState)[brickId]),
});

export const useBricks = () => {
  const bricks = useRecoilValue(bricksState);
  const pushBrick = useRecoilCallback(
    ({ snapshot, set }) => async (newBrick: Brick) => {
      const brickDict = { ...(await snapshot.getPromise(brickDictState)) };
      const brickOrder = [...(await snapshot.getPromise(brickOrderState))];
      brickDict[newBrick.brickId] = newBrick;
      brickOrder.push(newBrick.brickId);
      set(brickDictState, brickDict);
      set(brickOrderState, brickOrder);
    }
  );
  return { bricks, pushBrick };
};

export const useBrick = (brickId: string) => {
  const [brick, updateBrick] = useRecoilState(brickStateFamily(brickId));
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
  return { brick, updateBrick, insertBrick };
};

export const createNewBrick = (noteType: Brick['noteType']): Brick => ({
  noteType,
  brickId: nanoid(),
  text: '',
  children: null,
});
