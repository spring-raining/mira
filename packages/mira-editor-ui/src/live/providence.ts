import { DependencyUpdateEventData, ModuleUpdateEventData } from '@mirajs/util';
import { ProvidenceStore } from '../hooks/providence/context';
import {
  Mira,
  EvaluatedResult,
  EvaluateState,
  RuntimeEnvironment,
  ASTNode,
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
// import { transpiler } from './transpiler';

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
  pauseCodeUpdates: () => () => void;
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
  onModuleUpdate: (e: ModuleUpdateEventData<BrickId>) => void;
  onRenderParamsUpdate: (e: RenderParamsUpdateInfo<BrickId>) => void;
}): Providence => {
  const _runtime = setupRuntime({
    framework,
    moduleLoader,
    base,
    depsContext,
  });

  const handleDependencyUpdate = ({
    detail,
  }: DependencyUpdateEvent<BrickId>) => {
    const runTarget = store.runTarget[detail.id];
    if (detail.id in store.runTasks) {
      window.cancelAnimationFrame(store.runTasks[detail.id][0]);
    }
    const miraId = runTarget.mira.id;
    // false positive?
    // eslint-disable-next-line prefer-const
    let runId: number;
    const cb = async () => {
      const result = (async (): Promise<EvaluatedResult> => {
        const [runtime] = await Promise.all([
          _runtime,
          new Promise((res) => setTimeout(res, inputDebounce)),
        ] as const);
        const environment = runtime.getRuntimeEnvironment();

        if (detail.transform?.errorObject) {
          return {
            id: miraId,
            environment,
            hasDefaultExport: false,
            error: detail.transform.errorObject,
            errorMarkers: detail.transform.errors,
            warnMarkers: detail.transform.warnings,
          };
        }
        const ret =
          detail.source &&
          detail.transform &&
          (await run({
            dependencyResult: {
              ...detail,
              source: detail.source,
              transform: detail.transform,
            },
            miraId,
            environment,
          }));
        return ret && store.runTasks[detail.id][0] === runId
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

  const dependency = new DependencyManager<BrickId>({
    base,
    depsContext,
    importerContext: mdxPath,
    moduleLoader,
  });
  dependency.addEventListener('dependencyUpdate', handleDependencyUpdate);
  dependency.addEventListener('moduleUpdate', handleModuleUpdate);
  dependency.addEventListener('renderParamsUpdate', handleRenderParamsUpdate);

  const run = async ({
    dependencyResult,
    miraId,
    environment,
  }: {
    dependencyResult: DependencyUpdateEventData<BrickId> &
      Required<
        Pick<DependencyUpdateEventData<BrickId>, 'source' | 'transform'>
      >;
    miraId: MiraId;
    environment: RuntimeEnvironment;
  }): Promise<EvaluatedResult | undefined> => {
    const runtimeScope = environment.getRuntimeScope({});
    for (const [k, v] of Object.entries(runtimeScope)) {
      (globalThis as any)[k] = v;
    }
    try {
      const mod = await import(
        /* webpackIgnore: true */ dependencyResult.source
      );
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
      dependency.updateSnippetExports(dependencyResult.id, exportVal);
      return {
        id: miraId,
        environment,
        hasDefaultExport,
        source: dependencyResult.source,
        errorMarkers: dependencyResult.transform.errors,
        warnMarkers: dependencyResult.transform.errors,
      };
    } catch (error) {
      console.error(error);
      return {
        id: miraId,
        environment,
        hasDefaultExport: false,
        source: dependencyResult.source,
        error:
          error instanceof Error
            ? error
            : new EvalError('Unexpected exception was thrown'),
        errorMarkers: dependencyResult.transform.errors,
        warnMarkers: dependencyResult.transform.errors,
      };
    }
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
      store.runTarget[id] = { mira };
    } else {
      delete store.runTarget[id];
    }
    if (typeof code === 'string') {
      dependency.upsertSnippet(id, code);
    } else {
      dependency.deleteSnippet(id);
    }
  };

  const dispatchScriptUpdates = async ({
    id,
    scriptNode,
  }: {
    id: BrickId;
    scriptNode: ASTNode[] | undefined;
  }) => {
    const scriptCode = scriptNode
      ?.filter((node) => node.type === 'mdxjsEsm')
      .map((node) => node.value as string);
    if (scriptCode && scriptCode.length > 0) {
      await dependency.upsertModule(id, scriptCode.join('\n'));
    } else {
      dependency.deleteModule(id);
    }
  };

  const refreshModule = async (event: RefreshModuleEvent) => {
    dependency.refreshModule(event);
  };

  const pauseCodeUpdates = () => {
    const cb = (async () => {
      return dependency.pauseTask();
    })();
    return async () => (await cb)?.();
  };

  return {
    dispatchCodeUpdates,
    dispatchScriptUpdates,
    refreshModule,
    pauseCodeUpdates,
    teardown: async () => {
      dependency.removeEventListener(
        'dependencyUpdate',
        handleDependencyUpdate,
      );
      dependency.removeEventListener('moduleUpdate', handleModuleUpdate);
      dependency.removeEventListener(
        'renderParamsUpdate',
        handleRenderParamsUpdate,
      );
    },
  };
};
