import { EsbuildTranspiler } from '@mirajs/transpiler-esbuild/browser';
import {
  DependencyManager as DependencyManagerBase,
  DependencyUpdateEventData,
  RenderParamsUpdateEventData,
} from '@mirajs/util';
import { EventTarget, Event } from 'event-target-shim';
import {
  ASTNode,
  DependencyUpdateInfo,
  ModuleImportInfo,
  RenderParamsUpdateInfo,
  RefreshModuleEvent,
} from '../types';

// const stripUrlParam = (url: string): string => url.split('?', 1)[0];

class CustomEvent<T extends string = string, S = unknown> extends Event<T> {
  public detail: S;
  constructor(message: T, data: Event.EventInit & { detail: S }) {
    super(message, data);
    this.detail = data.detail;
  }
}

export type DependencyUpdateEvent<ID extends string> = CustomEvent<
  'dependencyUpdate',
  DependencyUpdateInfo<ID>
>;

export type ModuleUpdateEvent<ID extends string> = CustomEvent<
  'moduleUpdate',
  ModuleImportInfo<ID>
>;

export type RenderParamsUpdateEvent<ID extends string> = CustomEvent<
  'renderParamsUpdate',
  RenderParamsUpdateInfo<ID>
>;

export type EventMap<ID extends string> = {
  dependencyUpdate: DependencyUpdateEvent<ID>;
  moduleUpdate: ModuleUpdateEvent<ID>;
  renderParamsUpdate: RenderParamsUpdateEvent<ID>;
};

export class DependencyManager<ID extends string>
  extends DependencyManagerBase<ID>
  implements EventTarget<EventMap<ID>>
{
  private base: string;
  private depsContext: string;
  private importerContext: string;
  private moduleLoader: (specifier: string) => Promise<unknown>;

  // private miraBrickModuleImportDef = {} as Record<ID, ModuleImportDefinition>;
  // private miraBrickModuleImportError = {} as Record<ID, Error>;
  // private moduleImportMapping: Record<string, ModuleImportMapping> = {};
  // private moduleProperties: Record<string, Set<string>> = {};

  private _eventTarget = new EventTarget();

  constructor({
    base,
    depsContext,
    importerContext,
    moduleLoader,
  }: {
    base: string;
    depsContext: string;
    importerContext: string;
    moduleLoader: (specifier: string) => Promise<unknown>;
  }) {
    super({
      transpiler: new EsbuildTranspiler(),
      snippetSourceBuilder: (id, snippet) => {
        const blob = new Blob([snippet], { type: 'application/javascript' });
        const source = URL.createObjectURL(blob);
        return source;
      },
      transpilerInitOption: {
        transpilerPlatform: 'browser',
      },
      transpilerTransformOption: {
        // loader should be tsx even if the code is JavaScript to strip unused imports
        loader: 'tsx',
        sourcefile: '[Mira]',
        treeShaking: true,
        target: 'es2020',
        logLevel: 'silent',
        jsxFactory: '$jsxFactory',
        jsxFragment: '$jsxFragmentFactory',
      },
      onDependencyUpdate: (event) => {
        this.effectDependency(event);
      },
      onRenderParamsUpdate: (event) => {
        this.effectRenderParams(event);
      },
      onSourceRevoke: ({ source }) => {
        URL.revokeObjectURL(source);
      },
    });
    this.base = base;
    this.depsContext = depsContext;
    this.importerContext = importerContext;
    this.moduleLoader = moduleLoader;
  }

  addEventListener<T extends keyof EventMap<ID>>(
    type: T,
    callback?: (event: EventMap<ID>[T]) => void | null,
  ): void {
    this._eventTarget.addEventListener(
      type,
      callback as EventTarget.EventListener<any, any>,
    );
  }

  removeEventListener<T extends keyof EventMap<ID>>(
    type: T,
    callback?: (event: EventMap<ID>[T]) => void | null,
  ): void {
    this._eventTarget.removeEventListener(
      type,
      callback as EventTarget.EventListener<any, any>,
    );
  }

  dispatchEvent<T extends keyof EventMap<ID>>(event: EventMap<ID>[T]): boolean {
    return this._eventTarget.dispatchEvent(event);
  }

  async effectDependency(data: DependencyUpdateEventData<ID>) {
    const event: DependencyUpdateEvent<ID> = new CustomEvent(
      'dependencyUpdate',
      { detail: data },
    );
    this.dispatchEvent(event);
  }

  async effectRenderParams({ id }: RenderParamsUpdateEventData<ID>) {
    const params = new Map<string, unknown>();
    this._snippetData[id]?.defaultFunctionParams?.forEach((p) => {
      if (this._exportVal.has(p)) {
        params.set(p, this._exportVal.get(p));
      }
    });
    const event: RenderParamsUpdateEvent<ID> = new CustomEvent(
      'renderParamsUpdate',
      {
        detail: {
          id,
          params,
        },
      },
    );
    this.dispatchEvent(event);
  }

  effectModuleUpdate(): Promise<void> {
    return this.serialTask(
      'moduleUpdate',
      function effectModuleUpdate(this: DependencyManager<ID>) {
        return this._effectModuleUpdate();
      }.bind(this),
    );
  }
  private async _effectModuleUpdate() {
    // TODO
    // const event: ModuleUpdateEvent<ID> = new CustomEvent('moduleUpdate', {
    //   detail: {
    //     importMapping: { ...this.moduleImportMapping },
    //     importDef: { ...this.miraBrickModuleImportDef },
    //     importError: { ...this.miraBrickModuleImportError },
    //   },
    // })
    // this.dispatchEvent(event);
  }

  upsertScript(id: ID, scriptNode: ASTNode[]) {
    // TODO
    // this.deferUpdateEvent(async () => {
    //   let esmImports: ParsedImportStatement[] = [];
    //   let mapping: ReturnType<typeof mapModuleValues> = {};
    //   try {
    //     esmImports = await collectEsmImports({
    //       node: scriptNode,
    //       base: this.base,
    //       depsContext: this.depsContext,
    //       importerContext: this.importerContext,
    //     });
    //     const importResults = await Promise.all(
    //       esmImports.map(async (definition) => {
    //         return {
    //           definition,
    //           mod: await loadModule({
    //             specifier: definition.specifier,
    //             moduleLoader: this.moduleLoader,
    //           }),
    //         };
    //       }),
    //     );
    //     importResults.forEach(({ definition, mod }) => {
    //       this.moduleProperties[stripUrlParam(definition.specifier)] = new Set(
    //         Object.keys(mod),
    //       );
    //     });
    //     mapping = importResults.reduce(
    //       (acc, { definition }) => ({
    //         ...acc,
    //         ...mapModuleValues({
    //           definition,
    //           moduleProperties:
    //             this.moduleProperties[stripUrlParam(definition.specifier)],
    //         }),
    //       }),
    //       mapping,
    //     );
    //     delete this.miraBrickModuleImportError[id];
    //   } catch (error) {
    //     if (error instanceof Error) {
    //       this.miraBrickModuleImportError[id] = error;
    //     }
    //   }
    //   const prevModuleMappedName =
    //     this.miraBrickModuleImportDef[id]?.mappedName ?? [];
    //   this.miraBrickModuleImportDef[id] = {
    //     mappedName: Object.keys(mapping),
    //     importDefinition: esmImports,
    //   };
    //   if (
    //     // Checking changes of moduleVal
    //     Object.entries(mapping).some(
    //       ([name, mapping]) =>
    //         !(name in this.moduleImportMapping) ||
    //         mapping.name !== this.moduleImportMapping[name].name ||
    //         mapping.specifier !== this.moduleImportMapping[name].specifier,
    //     ) ||
    //     prevModuleMappedName.some((name) => !(name in mapping))
    //   ) {
    //     const prevImportMapping = { ...this.moduleImportMapping };
    //     prevModuleMappedName.forEach((name) => {
    //       delete prevImportMapping[name];
    //     });
    //     this.moduleImportMapping = Object.keys(mapping).reduce(
    //       (acc, k) => ({
    //         ...acc,
    //         [k]: {
    //           ...mapping[k],
    //           url: stripUrlParam(mapping[k].specifier),
    //         },
    //       }),
    //       prevImportMapping,
    //     );
    //   }
    //   this.effectModuleUpdate();
    //   (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
    //     this.effectDependency(id);
    //   });
    // });
  }

  deleteScript(id: ID) {
    // TODO
    // this.deferUpdateEvent(async () => {
    //   const mappedName = this.miraBrickModuleImportDef[id]?.mappedName ?? [];
    //   if (mappedName.every((name) => !(name in this.moduleImportMapping))) {
    //     return;
    //   }
    //   const nextImportMapping = { ...this.moduleImportMapping };
    //   mappedName.forEach((name) => {
    //     delete nextImportMapping[name];
    //   });
    //   this.moduleImportMapping = nextImportMapping;
    //   this.clearBrickItem(id);
    //   this.effectModuleUpdate();
    //   (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
    //     this.effectDependency(id);
    //   });
    // });
  }

  refreshModule({
    url: refreshedModuleUrl,
    module,
    viteUpdate,
  }: RefreshModuleEvent) {
    // TODO
    // this.deferUpdateEvent(async () => {
    //   const url = stripUrlParam(refreshedModuleUrl);
    //   const nextSpecifier = (() => {
    //     const { origin, pathname, search, hash } = new URL(refreshedModuleUrl);
    //     let s = search;
    //     const newTimestampQuery = `t=${viteUpdate.timestamp}`;
    //     const timestampQueryMatch = s.match(/(t=\d+)/);
    //     if (timestampQueryMatch) {
    //       const { index, 1: str } = timestampQueryMatch;
    //       s =
    //         s.slice(0, index ?? 0) +
    //         newTimestampQuery +
    //         s.slice((index ?? 0) + str.length);
    //     } else {
    //       s += (s ? '&' : '?') + newTimestampQuery;
    //     }
    //     return `${origin}${pathname}${s}${hash}`;
    //   })();
    //   const affectedModuleImportDef = (
    //     Object.entries(this.miraBrickModuleImportDef) as [
    //       ID,
    //       ModuleImportDefinition,
    //     ][]
    //   ).filter(([, { importDefinition }]) =>
    //     importDefinition.some((s) => stripUrlParam(s.specifier) === url),
    //   );
    //   if (affectedModuleImportDef.length === 0) {
    //     return;
    //   }
    //   this.moduleProperties[stripUrlParam(nextSpecifier)] = new Set(
    //     Object.keys((module ?? {}) as Record<string, unknown>),
    //   );
    //   let nextImportMapping = { ...this.moduleImportMapping };
    //   affectedModuleImportDef.forEach(
    //     ([id, { mappedName, importDefinition }]) => {
    //       let mapping: ReturnType<typeof mapModuleValues> = {};
    //       mappedName.forEach((name) => {
    //         delete nextImportMapping[name];
    //       });
    //       const nextImportDefinition = importDefinition.map((definition) =>
    //         stripUrlParam(definition.specifier) === url
    //           ? { ...definition, specifier: nextSpecifier }
    //           : definition,
    //       );
    //       try {
    //         mapping = nextImportDefinition.reduce(
    //           (acc, definition) => ({
    //             ...acc,
    //             ...mapModuleValues({
    //               moduleProperties:
    //                 this.moduleProperties[stripUrlParam(definition.specifier)],
    //               definition,
    //             }),
    //           }),
    //           mapping,
    //         );
    //         delete this.miraBrickModuleImportError[id];
    //       } catch (error) {
    //         if (error instanceof Error) {
    //           this.miraBrickModuleImportError[id] = error;
    //         }
    //       }
    //       nextImportMapping = Object.keys(mapping).reduce(
    //         (acc, k) => ({
    //           ...acc,
    //           [k]: {
    //             ...mapping[k],
    //             url: stripUrlParam(mapping[k].specifier),
    //           },
    //         }),
    //         nextImportMapping,
    //       );
    //       this.miraBrickModuleImportDef[id] = {
    //         mappedName: Object.keys(mapping),
    //         importDefinition: nextImportDefinition,
    //       };
    //     },
    //   );
    //   this.moduleImportMapping = nextImportMapping;
    //   this.effectModuleUpdate();
    //   (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
    //     this.effectDependency(id);
    //   });
    // });
  }
}
