import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import { Asteroid } from '../types';
import { RuntimeEnvironment } from '../Universe/runtimeScope';
import {
  asteroidDeclaredValueDictState,
  asteroidValuesExportedState,
} from './atoms';

const compareByArrayContent = <T extends string | number>(a: T[], b: T[]) => {
  // Check element intersection
  return a.every((v) => b.includes(v)) && b.every((v) => a.includes(v));
};

export const exportedValuesFamily = selectorFamily<string[], string>({
  key: 'exportedValuesFamily',
  get: (asteroidId) => ({ get }) =>
    get(asteroidValuesExportedState)[asteroidId] ?? [],
  set: (asteroidId) => ({ set, get }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }
    const prevValue = get(asteroidValuesExportedState)[asteroidId] ?? [];
    if (!compareByArrayContent(prevValue, newValue)) {
      set(asteroidValuesExportedState, (prevState) => {
        return {
          ...prevState,
          [asteroidId]: newValue,
        };
      });
    }
  },
});

const useScope = (asteroidId: string) => {
  const selfExportValNames = useRecoilValue(exportedValuesFamily(asteroidId));
  const declaredValueDict = useRecoilValue(asteroidDeclaredValueDictState);
  const [declaredValues, setDeclaredValues] = useState(() =>
    Object.keys(declaredValueDict).filter(
      (v) => !selfExportValNames.includes(v)
    )
  );
  const [scope, setScope] = useState(() => {
    const sc = { ...declaredValueDict };
    selfExportValNames.forEach((key) => {
      delete sc[key];
    });
    return sc;
  });
  useEffect(() => {
    const newDeclaredVal = Object.keys(declaredValueDict).filter(
      (v) => !selfExportValNames.includes(v)
    );
    const changed = !compareByArrayContent(newDeclaredVal, declaredValues);
    if (changed) {
      setDeclaredValues(newDeclaredVal);
    }
    if (
      changed ||
      newDeclaredVal.some((v) => scope[v] !== declaredValueDict[v])
    ) {
      const sc = { ...declaredValueDict };
      selfExportValNames.forEach((key) => {
        delete sc[key];
      });
      setScope(sc);
    }
  }, [declaredValues, scope, selfExportValNames, declaredValueDict]);

  return { scope, declaredValues };
};

const useValueEvaluator =  <T extends RuntimeEnvironment>(asteroidId: string) => {
  const [exportVal, setExportVal] = useRecoilState(
    exportedValuesFamily(asteroidId)
  );
  const updateDeclaredVals = useRecoilCallback(
    ({ snapshot, set }) => async (
      addVals: Record<string, unknown>,
      deleteValNames: string[]
    ) => {
      const newVals = {
        ...(await snapshot.getPromise(asteroidDeclaredValueDictState)),
        ...addVals,
      };
      deleteValNames.forEach((name) => {
        delete newVals[name];
      });
      set(asteroidDeclaredValueDictState, newVals);
    }
  );

  const valueEvaluatorRef = useRef<
    | ((arg: { evaluated: T; errorCallback: (error: Error) => void }) => void)
    | null
  >(null);
  // Setting callback that updates export values
  useEffect(() => {
    let stalled = false;
    const teardownFunctions: (() => void)[] = [];
    valueEvaluatorRef.current = ({
      evaluated,
      errorCallback,
    }: {
      evaluated: T;
      errorCallback: (error: Error) => void;
    }) => {
      const constantVal = Object.entries(evaluated.exportVal).filter(
        ([, v]) => typeof v !== 'function'
      );
      const deleteValNames = exportVal.filter(
        (v) => !(v in evaluated.exportVal)
      );
      setExportVal(Object.keys(evaluated.exportVal));
      updateDeclaredVals(
        constantVal.reduce<Record<string, unknown>>(
          (prev, [k, v]) => ({ ...prev, [k]: v }),
          {}
        ),
        deleteValNames
      );
      const functionalVal = Object.entries(evaluated.exportVal).filter(
        ([, v]) => typeof v === 'function'
      );
      // Sets undefined value until functional computation is finished
      if (functionalVal.length > 0) {
        updateDeclaredVals(
          functionalVal.reduce<Record<string, undefined>>(
            (prev, [k]) => ({ ...prev, [k]: undefined }),
            {}
          ),
          []
        );
      }
      for (let [k, func] of functionalVal) {
        const update = (val: unknown) => updateDeclaredVals({ [k]: val }, []);
        const callbackIdList: number[] = [];
        const clearCallbacks = () => {
          let id: number | undefined;
          while ((id = callbackIdList.shift())) {
            window.cancelIdleCallback(id);
          }
        };
        // eslint-disable-next-line no-loop-func
        const run = () => {
          if (stalled) {
            return;
          }
          const callbackId = window.requestIdleCallback(() => {
            try {
              clearCallbacks();
              callbackIdList.push(callbackId);
              update(func(run));
            } catch (error) {
              window.cancelIdleCallback(callbackId);
              errorCallback(error);
            }
          });
        };
        teardownFunctions.push(clearCallbacks);
        run();
      }
      return () => {
        stalled = true;
        teardownFunctions.forEach((fn) => fn());
      };
    };
  }, [exportVal, setExportVal, updateDeclaredVals]);

  return valueEvaluatorRef;
};

export const useProvidence = <T extends RuntimeEnvironment>({
  id: asteroidId,
}: Asteroid) => {
  const { scope, declaredValues } = useScope(asteroidId);
  const valueEvaluatorRef = useValueEvaluator(asteroidId);

  const runtimeEnvironment = useRef<T>();
  const evaluate = useCallback(
    ({
      environment,
      errorCallback,
    }: {
      environment: T;
      errorCallback: (error: Error) => void;
    }) => (renderer: () => Promise<Either<Error, T>>) => {
      runtimeEnvironment.current = environment;
      const runId = environment.envId;
      const run = () => {
        const cb = valueEvaluatorRef.current;
        renderer().then((ret) => {
          if (runtimeEnvironment.current?.envId !== runId || ret[0]) {
            return;
          }
          if (valueEvaluatorRef.current !== cb) {
            window.requestAnimationFrame(run);
            return;
          }
          cb?.({
            evaluated: ret[1],
            errorCallback,
          });
        });
      };
      window.requestAnimationFrame(run);
    },
    [valueEvaluatorRef]
  );

  return { evaluate, scope, declaredValues };
};
