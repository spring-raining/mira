import { useCallback, useRef, useState, useEffect } from 'react';
import {
  useRecoilCallback,
  useRecoilState,
  useRecoilValue,
  selectorFamily,
  DefaultValue,
} from 'recoil';
import {
  asteroidDeclaredValueDictState,
  asteroidValuesExportedState,
  Asteroid,
} from '../atoms';

const compareByArrayContent = <T extends string | number>(a: T[], b: T[]) => {
  // Check element intersection
  return a.every((v) => b.includes(v)) && b.every((v) => a.includes(v));
};

const exportedValuesFamily = selectorFamily<string[], string>({
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

export const useProvidence = <
  T extends {
    exportVal: Record<string, any>;
    referenceVal: Record<string, any>;
  }
>({
  id: asteroidId,
}: Asteroid) => {
  const [exportVal, setExportVal] = useRecoilState(
    exportedValuesFamily(asteroidId)
  );
  const { scope, declaredValues } = useScope(asteroidId);
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

  const evaluatorCallback = useRef<((env: T) => void) | null>(null);
  useEffect(() => {
    evaluatorCallback.current = (evaluated) => {
      const deleteValNames = exportVal.filter((v) => !(v in evaluated.exportVal));
      setExportVal(Object.keys(evaluated.exportVal));
      updateDeclaredVals(evaluated.exportVal, deleteValNames);
    };
  }, [exportVal, setExportVal, updateDeclaredVals]);

  const evaluatorId = useRef<number>();
  const evaluate = useCallback((renderer: () => Promise<Either<Error, T>>) => {
    let runId: number | undefined;
    const run = () => {
      const cb = evaluatorCallback.current;
      renderer().then((ret) => {
        if (evaluatorId.current !== runId || ret[0]) {
          return;
        }
        if (evaluatorCallback.current !== cb) {
          runId = window.requestAnimationFrame(run);
          evaluatorId.current = runId;
          return;
        }
        cb?.(ret[1]);
      });
    };
    runId = window.requestAnimationFrame(run);
    evaluatorId.current = runId;
  }, []);

  return { evaluate, scope, declaredValues };
};
