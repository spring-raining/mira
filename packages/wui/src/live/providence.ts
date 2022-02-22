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
  RenderParamsUpdateEvent,
  RenderParamsUpdatePayload,
} from './dependency';
import { setupRuntime } from './runtime';
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
  onRenderParamsUpdate,
}: {
  store: ProvidenceStore;
  runtime: string;
  mdxPath: string;
  depsRootPath: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  onEvaluatorUpdate: (e: EvaluatedResult) => void;
  onModuleUpdate: (e: ModuleImportState) => void;
  onRenderParamsUpdate: (e: RenderParamsUpdatePayload) => void;
}): Providence => {
  const _runtime = setupRuntime({
    runtime,
    moduleLoader,
    depsRootPath,
  });

  const run = async ({
    id,
    miraId,
    code,
    environment,
    importModules,
  }: // exportVal,
  // moduleVal,
  {
    id: string;
    miraId: string;
    code: string;
    environment: RuntimeEnvironment;
    importModules: [string, string[]][];
    // exportVal: Map<string, unknown>;
    // moduleVal: Map<string, unknown>;
  }): Promise<EvaluatedResult> => {
    // const scopeVal = new Map([...moduleVal, ...exportVal]);
    const transpiledData = await transpileCode({
      code,
      importModules,
    });
    if (transpiledData.errorObject || typeof transpiledData.text !== 'string') {
      return {
        id: miraId,
        environment,
        error: transpiledData.errorObject,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    }
    const transpiledCode = transpiledData.text;
    try {
      const source = URL.createObjectURL(
        new Blob([transpiledCode], { type: 'application/javascript' }),
      );
      const mod = await import(/* webpackIgnore: true */ source);
      const exportVal = new Map<string, unknown>();
      for (const [k, v] of Object.entries(mod)) {
        if (k === 'default') {
          // ignore default exports
          continue;
        }
        exportVal.set(k, v);
      }
      store.dependency?.updateExports(id, source, exportVal);
      // await asyncEval(transpiledCode, scopeVal, environment);
      // store.dependency?.updateExports(environment.exportVal);
      return {
        id: miraId,
        environment,
        code: transpiledCode,
        source,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    } catch (error) {
      console.error(error);
      return {
        id: miraId,
        environment,
        code: transpiledCode,
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
    // false positive?
    // eslint-disable-next-line prefer-const
    let runId: number;
    const cb = async () => {
      const environment = (await _runtime).getRuntimeEnvironment();
      const ret = await run({
        id: detail.id,
        miraId: runTarget.mira.id,
        code: runTarget.code,
        environment,
        importModules: detail.importModules,
        // exportVal: detail.exportVal,
        // moduleVal: detail.moduleVal,
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

  const handleRenderParamsUpdate = ({ detail }: RenderParamsUpdateEvent) => {
    onRenderParamsUpdate(detail);
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
  store.dependency.addEventListener(
    'renderParamsUpdate',
    handleRenderParamsUpdate,
  );

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
      store.dependency?.removeEventListener(
        'renderParamsUpdate',
        handleRenderParamsUpdate,
      );
      store.dependency = undefined;
    },
  };
};
