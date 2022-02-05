import { useRecoilValue, selectorFamily } from 'recoil';
import { renderLiveElement } from '../live/renderLiveElement';
import { MarkerMessage } from '../types';
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

const miraOutputFamily = selectorFamily({
  key: 'miraOutputFamily',
  get:
    (miraId: string) =>
    async ({
      get,
    }): Promise<
      | {
          element?: React.ReactNode;
          error?: Error;
          errorMarkers?: MarkerMessage[];
          warnMarkers?: MarkerMessage[];
        }
      | undefined
    > => {
      const evaluatedData = get(miraEvaluatedDataFamily(miraId));
      if (!evaluatedData) {
        return undefined;
      }
      const { error, environment } = evaluatedData;
      if (error || !environment) {
        return {
          error: error,
          errorMarkers: evaluatedData.errorMarkers,
          warnMarkers: evaluatedData.warnMarkers,
        };
      }
      return await new Promise((resolve) => {
        let element: React.ReactNode;
        renderLiveElement({
          environment,
          resultCallback: (ret) => {
            element = ret;
          },
          errorCallback: (error) => {
            resolve({
              error,
              errorMarkers: evaluatedData.errorMarkers,
              warnMarkers: evaluatedData.warnMarkers,
            });
          },
        });
        if (element) {
          resolve({
            element,
            errorMarkers: evaluatedData.errorMarkers,
            warnMarkers: evaluatedData.warnMarkers,
          });
        }
      });
    },
});

export const useEvaluatedData = (miraId: string) => {
  const evaluatedData = useRecoilValue(miraEvaluatedDataFamily(miraId));
  return { evaluatedData };
};

export const useRenderParams = (brickId: string) => {
  const renderParams = useRecoilValue(miraRenderParamsFamily(brickId));
  return { renderParams };
};

export const useRenderedData = (miraId: string) => {
  const output = useRecoilValue(miraOutputFamily(miraId));

  return {
    output: output,
  };
};
