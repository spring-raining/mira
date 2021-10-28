import { ProvidenceStore } from '../hooks/providence/context';
import { Mira, EvaluatedResult, RuntimeEnvironment } from '../types';
import { asyncEval } from './asyncEval';
import { DependencyUpdateEvent } from './dependency';
import { setupRuntimeEnvironment } from './runtimeScope';
import { transpileCode } from './transpileCode';

export interface Providence {
  dispatch: ({
    brickId,
    code,
    mira,
  }: {
    brickId: string;
    code: string | undefined;
    mira: Mira | undefined;
  }) => void;
  teardown: () => void;
}

export const setupProvidence = ({
  store,
  onEvaluatorUpdate,
}: {
  store: ProvidenceStore;
  onEvaluatorUpdate: (e: EvaluatedResult) => void;
}): Providence => {
  const run = async ({
    id,
    code,
    environment,
    exportVal,
  }: {
    id: string;
    code: string;
    environment: RuntimeEnvironment;
    exportVal: Record<string, unknown>;
  }): Promise<EvaluatedResult> => {
    const transpiledData = await transpileCode({
      code,
      declaredValues: Object.keys(exportVal),
    });
    if (transpiledData.errorObject || typeof transpiledData.text !== 'string') {
      return {
        id,
        environment,
        error: transpiledData.errorObject,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    }
    try {
      await asyncEval(transpiledData.text, exportVal, environment);
      store.dependency.updateExports(environment.exportVal);
      return {
        id,
        environment,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    } catch (error) {
      return {
        id,
        environment,
        error,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    }
  };

  const handleDependencyUpdate = ({ detail }: DependencyUpdateEvent) => {
    console.log('dependencyUpdate', detail);
    if (detail.id in store.runTasks) {
      window.cancelAnimationFrame(store.runTasks[detail.id]);
      delete store.runTasks[detail.id];
    }
    const runTarget = store.runTarget[detail.id];
    if (typeof runTarget?.code !== 'string') {
      return;
    }
    const environment = setupRuntimeEnvironment();
    let runId: number;
    const cb = async () => {
      const ret = await run({
        id: runTarget.mira.id,
        code: runTarget.code,
        environment,
        exportVal: detail.exportVal,
      });
      if (store.runTasks[detail.id] === runId) {
        onEvaluatorUpdate(ret);
      }
    };
    runId = window.requestAnimationFrame(cb);
    store.runTasks[detail.id] = runId;
  };
  store.dependency.addEventListener('dependencyUpdate', handleDependencyUpdate);

  const dispatch = ({
    brickId,
    code,
    mira,
  }: {
    brickId: string;
    code: string | undefined;
    mira: Mira | undefined;
  }) => {
    if (typeof code === 'string' && mira) {
      store.runTarget[brickId] = { code, mira };
    } else {
      delete store.runTarget[brickId];
    }
    if (typeof code === 'string') {
      store.dependency.upsertCode(brickId, code);
    } else {
      store.dependency.deleteCode(brickId);
    }
  };

  return {
    dispatch,
    teardown: () => {
      store.dependency.removeEventListener(
        'dependencyUpdate',
        handleDependencyUpdate
      );
    },
  };
};
