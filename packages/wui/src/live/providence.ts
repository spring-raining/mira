import { ProvidenceStore } from '../hooks/providence/context';
import {
  Mira,
  EvaluatedResult,
  RuntimeEnvironment,
  ASTNode,
  ModuleImportState,
  RefreshModuleEvent,
} from '../types';
import { asyncEval } from './asyncEval';
import {
  DependencyManager,
  DependencyUpdateEvent,
  ModuleUpdateEvent,
} from './dependency';
import { setupRuntimeEnvironment } from './runtimeEnvironment';
import { transpileCode } from './transpileCode';

export interface Providence {
  dispatchCodeUpdates: ({
    id,
    code,
    mira,
  }: {
    id: string;
    code: string | undefined;
    mira: Mira | undefined;
  }) => void;
  dispatchScriptUpdates: ({
    id,
    scriptNode,
  }: {
    id: string;
    scriptNode: ASTNode[] | undefined;
  }) => void;
  refreshModule: (event: RefreshModuleEvent) => void;
  teardown: () => void;
}

export const setupProvidence = ({
  store,
  runtime,
  mdxPath,
  depsRootPath,
  moduleLoader,
  onEvaluatorUpdate,
  onModuleUpdate,
}: {
  store: ProvidenceStore;
  runtime: string;
  mdxPath: string;
  depsRootPath: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  onEvaluatorUpdate: (e: EvaluatedResult) => void;
  onModuleUpdate: (e: ModuleImportState) => void;
}): Providence => {
  const { getRuntimeEnvironment } = setupRuntimeEnvironment({ runtime });

  const run = async ({
    id,
    code,
    environment,
    exportVal,
    moduleVal,
  }: {
    id: string;
    code: string;
    environment: RuntimeEnvironment;
    exportVal: Record<string, unknown>;
    moduleVal: Record<string, unknown>;
  }): Promise<EvaluatedResult> => {
    const scopeVal = { ...moduleVal, ...exportVal };
    const transpiledData = await transpileCode({
      code,
      declaredValues: Object.keys(scopeVal),
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
      await asyncEval(transpiledData.text, scopeVal, environment);
      store.dependency?.updateExports(environment.exportVal);
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
        error:
          error instanceof Error
            ? error
            : new EvalError('Unexpected exception was thrown'),
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    }
  };

  const handleDependencyUpdate = ({ detail }: DependencyUpdateEvent) => {
    if (detail.id in store.runTasks) {
      window.cancelAnimationFrame(store.runTasks[detail.id]);
      delete store.runTasks[detail.id];
    }
    const runTarget = store.runTarget[detail.id];
    if (typeof runTarget?.code !== 'string') {
      return;
    }
    const environment = getRuntimeEnvironment();
    // false positive?
    // eslint-disable-next-line prefer-const
    let runId: number;
    const cb = async () => {
      const ret = await run({
        id: runTarget.mira.id,
        code: runTarget.code,
        environment,
        exportVal: detail.exportVal,
        moduleVal: detail.moduleVal,
      });
      if (store.runTasks[detail.id] === runId) {
        onEvaluatorUpdate(ret);
      }
    };
    runId = window.requestAnimationFrame(cb);
    store.runTasks[detail.id] = runId;
  };

  const handleModuleUpdate = ({ detail }: ModuleUpdateEvent) => {
    onModuleUpdate(detail);
  };

  const dispatchCodeUpdates = ({
    id,
    code,
    mira,
  }: {
    id: string;
    code: string | undefined;
    mira: Mira | undefined;
  }) => {
    if (typeof code === 'string' && mira) {
      store.runTarget[id] = { code, mira };
    } else {
      delete store.runTarget[id];
    }
    if (typeof code === 'string') {
      store.dependency?.upsertCode(id, code);
    } else {
      store.dependency?.deleteCode(id);
    }
  };

  const dispatchScriptUpdates = ({
    id,
    scriptNode,
  }: {
    id: string;
    scriptNode: ASTNode[] | undefined;
  }) => {
    if (scriptNode) {
      store.dependency?.upsertScript(id, scriptNode);
    } else {
      store.dependency?.deleteScript(id);
    }
  };

  const refreshModule = (event: RefreshModuleEvent) => {
    store.dependency?.refreshModule(event);
  };

  store.dependency = new DependencyManager({
    mdxPath,
    depsRootPath,
    moduleLoader,
  });
  store.dependency.addEventListener('dependencyUpdate', handleDependencyUpdate);
  store.dependency.addEventListener('moduleUpdate', handleModuleUpdate);

  return {
    dispatchCodeUpdates,
    dispatchScriptUpdates,
    refreshModule,
    teardown: () => {
      store.dependency?.removeEventListener(
        'dependencyUpdate',
        handleDependencyUpdate,
      );
      store.dependency?.removeEventListener('moduleUpdate', handleModuleUpdate);
      store.dependency = undefined;
    },
  };
};
