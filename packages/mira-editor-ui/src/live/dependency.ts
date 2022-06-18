import { EsbuildTranspiler } from '@mirajs/transpiler-esbuild/browser';
import {
  DependencyManager as DependencyManagerBase,
  DependencyUpdateEventData,
  RenderParamsUpdateEventData,
} from '@mirajs/util';
import { EventTarget, Event } from 'event-target-shim';
import { RenderParamsUpdateInfo } from '../types';
import { ModuleUpdateEventData } from './../../../util/src/dependency-manager/types';
import { resolveImportSpecifier } from './../mdx/imports';

class CustomEvent<T extends string = string, S = unknown> extends Event<T> {
  public detail: S;
  constructor(message: T, data: Event.EventInit & { detail: S }) {
    super(message, data);
    this.detail = data.detail;
  }
}

export type DependencyUpdateEvent<ID extends string> = CustomEvent<
  'dependencyUpdate',
  DependencyUpdateEventData<ID>
>;

export type ModuleUpdateEvent<ID extends string> = CustomEvent<
  'moduleUpdate',
  ModuleUpdateEventData<ID>
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
      moduleImportSpecifierBuilder: (specifier) =>
        resolveImportSpecifier({
          specifier,
          base,
          depsContext,
          importerContext,
        }),
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
      onModuleUpdate: (event) => {
        this.effectModule(event);
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

  async effectModule(data: ModuleUpdateEventData<ID>) {
    const event: ModuleUpdateEvent<ID> = new CustomEvent('moduleUpdate', {
      detail: data,
    });
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
}
