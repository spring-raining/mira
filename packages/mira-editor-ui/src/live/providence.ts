import { ImportDefinition, MiraTranspilerBase } from '@mirajs/util';
import { ProvidenceStore } from '../hooks/providence/context';
import {
  Mira,
  EvaluatedResult,
  EvaluateState,
  RuntimeEnvironment,
  ASTNode,
  ModuleImportInfo,
  RenderParamsUpdateInfo,
  RefreshModuleEvent,
  BrickId,
  MiraId,
} from '../types';
import {
  DependencyManager,
  DependencyUpdateEvent,
  ModuleUpdateEvent,
  RenderParamsUpdateEvent,
} from './dependency';
import { setupRuntime } from './runtime';
import { getTranspiler, buildCode } from './transpiler';

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
  pauseCodeUpdates: () => void;
  resumeCodeUpdates: () => void;
  teardown: () => void;
}

export const setupProvidence = ({
  store,
  framework,
  inputDebounce = 66,
  mdxPath,
  base,
  depsContext,
  moduleLoader,
  onEvaluatorUpdate,
  onModuleUpdate,
  onRenderParamsUpdate,
}: {
  store: ProvidenceStore;
  framework: string;
  inputDebounce?: number;
  mdxPath: string;
  base: string;
  depsContext: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  onEvaluatorUpdate: (e: EvaluateState) => void;
  onModuleUpdate: (e: ModuleImportInfo<BrickId>) => void;
  onRenderParamsUpdate: (e: RenderParamsUpdateInfo<BrickId>) => void;
}): Providence => {
  const _runtime = setupRuntime({
    framework,
    moduleLoader,
    base,
    depsContext,
  });

  const run = async ({
    id,
    miraId,
    code,
    environment,
    resolvedValues,
    importDefinitions,
  }: {
    id: BrickId;
    miraId: MiraId;
    code: string;
    environment: RuntimeEnvironment;
    resolvedValues: readonly [string, string[]][];
    importDefinitions: readonly ImportDefinition[];
  }): Promise<EvaluatedResult> => {
    const transpiledData = await buildCode({
      code,
      resolvedValues,
      importDefinitions,
    });
    const transpiledCode = transpiledData.result?.[0].text;
    if (transpiledData.errorObject || typeof transpiledCode !== 'string') {
      return {
        id: miraId,
        environment,
        hasDefaultExport: false,
        error: transpiledData.errorObject,
        errorMarkers: transpiledData.errors,
        warnMarkers: transpiledData.warnings,
      };
    }
    const runtimeScope = environment.getRuntimeScope({});
    for (const [k, v] of Object.entries(runtimeScope)) {
      (globalThis as any)[k] = v;
    }
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
      store.dependency?.updateSnippetExports(id, source, exportVal);
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
    resolvedValues,
    importDefinitions,
    dependencyError,
  }: {
    miraId: MiraId;
    code: string;
    environment: RuntimeEnvironment;
    resolvedValues: readonly [string, string[]][];
    importDefinitions: readonly ImportDefinition[];
    dependencyError: Error;
  }): Promise<EvaluatedResult> => {
    const transpiledData = await buildCode({
      code,
      resolvedValues,
      importDefinitions,
    });
    const transpiledCode = transpiledData.result?.[0].text;
    if (transpiledData.errorObject || typeof transpiledCode !== 'string') {
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
              resolvedValues: detail.resolvedValues,
              importDefinitions: detail.importDefinitions,
              dependencyError: detail.dependencyError,
            })
          : await run({
              id: detail.id,
              miraId,
              code,
              environment,
              resolvedValues: detail.resolvedValues,
              importDefinitions: detail.importDefinitions,
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

  const handleModuleUpdate = ({ detail }: ModuleUpdateEvent<BrickId>) => {
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
      store.dependency?.upsertSnippet(id, code);
    } else {
      store.dependency?.deleteSnippet(id);
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

  // let isPaused = false;

  // const pauseCodeUpdates = () => {
  //   if (!isPaused) {
  //     isPaused = true;
  //     store.dependency?.pauseUpdateEvent();
  //   }
  // };

  // const resumeCodeUpdates = () => {
  //   if (isPaused) {
  //     isPaused = false;
  //     store.dependency?.resumeUpdateEvent();
  //   }
  // };
  let resume: (() => void) | undefined;
  const pauseCodeUpdates = () => {
    if (!resume) {
      resume = store.dependency?.pauseTask();
    }
  };
  const resumeCodeUpdates = () => {
    if (resume) {
      resume();
      resume = undefined;
    }
  };

  let isAborted = false;
  (async () => {
    const transpiler = await getTranspiler();
    if (isAborted) {
      return;
    }
    store.dependency = new DependencyManager<BrickId>({
      transpiler,
      base,
      depsContext,
      importerContext: mdxPath,
      moduleLoader,
    });
    store.dependency.addEventListener(
      'dependencyUpdate',
      handleDependencyUpdate,
    );
    store.dependency.addEventListener('moduleUpdate', handleModuleUpdate);
    store.dependency.addEventListener(
      'renderParamsUpdate',
      handleRenderParamsUpdate,
    );
  })();

  return {
    dispatchCodeUpdates,
    dispatchScriptUpdates,
    refreshModule,
    pauseCodeUpdates,
    resumeCodeUpdates,
    teardown: () => {
      isAborted = true;
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
