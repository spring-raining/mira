import { useRecoilValue } from 'recoil';
import { miraRenderParamsDictState, miraEvaluatedDataDictState } from './atoms';
import { getDictItemSelector } from './helper';

const miraRenderParamsFamily = getDictItemSelector({
  key: 'miraRenderParamsFamily',
  state: miraRenderParamsDictState,
});

const miraEvaluatedDataFamily = getDictItemSelector({
  key: 'miraEvaluatedDataFamily',
  state: miraEvaluatedDataDictState,
});

export const useEvaluatedData = (miraId: string) => {
  const evaluatedData = useRecoilValue(miraEvaluatedDataFamily(miraId));
  return { evaluatedData };
};

export const useRenderParams = (brickId: string) => {
  const renderParams = useRecoilValue(miraRenderParamsFamily(brickId));
  return { renderParams };
};
