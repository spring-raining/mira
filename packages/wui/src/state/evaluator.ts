import { selectorFamily, useRecoilValue, useRecoilValueLoadable } from 'recoil';
import { MiraId, BrickId } from '../types';
import { miraRenderParamsDictState, miraEvaluateStateDictState } from './atoms';
import { getDictItemSelector } from './helper';

const miraRenderParamsFamily = getDictItemSelector({
  key: 'miraRenderParamsFamily',
  state: miraRenderParamsDictState,
});

const miraEvaluateResultFamily = selectorFamily({
  key: 'miraEvaluateResultFamily',
  get:
    (miraId: MiraId | undefined) =>
    async ({ get }) => {
      const evaluateState = miraId && get(miraEvaluateStateDictState)[miraId];
      return evaluateState && (await evaluateState.result);
    },
});

export const useEvaluatedResultLoadable = (miraId?: MiraId) => {
  const evaluatedResultLoadable = useRecoilValueLoadable(
    miraEvaluateResultFamily(miraId),
  );
  return { evaluatedResultLoadable };
};

export const useRenderParams = (brickId: BrickId) => {
  const renderParams = useRecoilValue(miraRenderParamsFamily(brickId));
  return { renderParams };
};
