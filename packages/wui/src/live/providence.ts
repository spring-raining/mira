import { ProvidenceStore } from '../hooks/providence/context';
import {
  Mira,
  EvaluatedResult,
  EvaluateState,
  RuntimeEnvironment,
  ASTNode,
  ModuleImportState,
  RefreshModuleEvent,
  BrickId,
  MiraId,
} from '../types';
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
    id: BrickId;
    code: string | undefined;
    mira: Mira | undefined;
  }) => void;
  dispatchScriptUpdates: ({
    id,
    scriptNode,
  }: {
    id: BrickId;
    scriptNode: ASTNode[] | undefined;
  }) => void;
  refreshModule: (event: RefreshModuleEvent) => void;
  teardown: () => void;
}

export const setupProvidence = ({
  store,
  runtime,
  inputDebounce = 66,
  mdxPath,
  depsRootPath,
  moduleLoader,
  onEvaluatorUpdate,
  onModuleUpdate,
  onRenderParamsUpdate,
}: {
  store: ProvidenceStore;
  runtime: string;
  inputDebounce?: number;
  mdxPath: string;
  depsRootPath: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  onEvaluatorUpdate: (e: EvaluateState) => void;
  onModuleUpdate: (e: ModuleImportState) => void;
  onRenderParamsUpdate: (e: RenderParamsUpdatePayload<BrickId>) => void;
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
  }: {
    id: BrickId;
    miraId: MiraId;
    code: string;
    environment: RuntimeEnvironment;
    importModules: [string, string[]][];
  }): Promise<EvaluatedResult> => {
    const transpiledData = await transpileCode({
      code,
      importModules,
    });
    if (transpiledData.errorObject || typeof transpiledData.text !== 'string') {
      return {
        id: miraId,
        environment,
        hasDefaultExport: false,
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
      let hasDefaultExport = false;
      for (const [k, v] of Object.entries(mod)) {
        if (k === 'default') {
          // ignore default exports
          hasDefaultExport = true;
          continue;
        }
        exportVal.set(k, v);
      }
      store.dependency?.updateExports(id, source, exportVal);
      return {
        id: miraId,
        environment,
        hasDefaultExport,
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
        hasDefaultExport: false,
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

  const transpileAndFail = async ({
    miraId,
    code,
    environment,
    importModules,
    dependencyError,
  }: {
    miraId: MiraId;
    code: string;
    environment: RuntimeEnvironment;
    importModules: [string, string[]][];
    dependencyError: Error;
  }): Promise<EvaluatedResult> => {
    const transpiledData = await transpileCode({
      code,
      importModules,
    });
    if (transpiledData.errorObject || typeof transpiledData.text !== 'string') {
      return {
        id: miraId,
        environment,
        hasDefaultExport: false,
        error: transpiledData.errorObject,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    } else {
      return {
        id: miraId,
        environment,
        hasDefaultExport: false,
        error: dependencyError,
        errorMarkers: [],
      };
    }
  };

  const handleDependencyUpdate = ({
    detail,
  }: DependencyUpdateEvent<BrickId>) => {
    const runTarget = store.runTarget[detail.id];
    if (typeof runTarget?.code !== 'string') {
      return;
    }
    if (detail.id in store.runTasks) {
      window.cancelAnimationFrame(store.runTasks[detail.id][0]);
    }
    const miraId = runTarget.mira.id;
    const code = runTarget.code;
    // false positive?
    // eslint-disable-next-line prefer-const
    let runId: number;
    const cb = async () => {
      const result = (async () => {
        const [runtime] = await Promise.all([
          _runtime,
          new Promise((res) => setTimeout(res, inputDebounce)),
        ] as const);
        const environment = runtime.getRuntimeEnvironment();
        const ret = detail.dependencyError
          ? await transpileAndFail({
              miraId,
              code,
              environment,
              importModules: detail.importModules,
              dependencyError: detail.dependencyError,
            })
          : await run({
              id: detail.id,
              miraId,
              code,
              environment,
              importModules: detail.importModules,
            });
        return store.runTasks[detail.id][0] === runId
          ? ret
          : store.runTasks[detail.id][1];
      })();
      onEvaluatorUpdate({
        id: miraId,
        result,
      });
      store.runTasks[detail.id] = [runId, result];
    };
    runId = window.requestAnimationFrame(cb);
  };

  const handleModuleUpdate = ({ detail }: ModuleUpdateEvent) => {
    onModuleUpdate(detail);
  };

  const handleRenderParamsUpdate = ({
    detail,
  }: RenderParamsUpdateEvent<BrickId>) => {
    onRenderParamsUpdate(detail);
  };

  const dispatchCodeUpdates = async ({
    id,
    code,
    mira,
  }: {
    id: BrickId;
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

  const dispatchScriptUpdates = async ({
    id,
    scriptNode,
  }: {
    id: BrickId;
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

  store.dependency = new DependencyManager<BrickId>({
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
