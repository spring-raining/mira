import { useEffect, useRef } from 'react';
import { useRecoilValue, selectorFamily } from 'recoil';
import { ContentBrick, MarkerMessage, EvaluatedResult } from '../types';
import { renderLiveElement } from '../live/renderLiveElement';
import { brickDictState, miraEvaluatedDataDictState } from './atoms';

const miraEvaluatedDataFamily = selectorFamily<EvaluatedResult, string>({
  key: 'miraEvaluatedDataFamily',
  get: (miraId: string) => ({ get }) => get(miraEvaluatedDataDictState)[miraId],
});

const miraOutputFamily = selectorFamily({
  key: 'miraOutputFamily',
  get: (miraId: string) => async ({
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

const miraRenderedDataFamily = selectorFamily<
  | {
      element?: React.ReactNode;
      error?: Error;
      errorMarkers?: MarkerMessage[];
      warnMarkers?: MarkerMessage[];
    }
  | undefined,
  string
>({
  key: 'miraRenderedDataFamily',
  get: (brickId: string) => ({ get }) => {
    const brick = get(brickDictState)[brickId];
    if (brick?.noteType !== 'content') {
      return undefined;
    }
    const contentBrick: ContentBrick = brick;
    if (!contentBrick.mira?.id) {
      return undefined;
    }
    return get(miraOutputFamily(contentBrick.mira.id));
  },
});

export const useRenderedData = (brickId: string) => {
  const settledOutput = useRef<{
    element?: React.ReactNode;
    error?: Error;
    errorMarkers?: MarkerMessage[];
    warnMarkers?: MarkerMessage[];
  }>();
  const output = useRecoilValue(miraRenderedDataFamily(brickId));

  useEffect(() => {
    settledOutput.current = output;
  }, [output]);
  return {
    // Show previous output to avoid a FOIC
    output: output ?? settledOutput.current,
  };
};
