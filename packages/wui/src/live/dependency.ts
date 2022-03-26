import {
  parseImportStatement,
  scanModuleSpecifier,
  scanDeclarations,
} from '@mirajs/core';
import type { ExportDefaultDeclaration } from '@mirajs/core/dist/declaration-parser/types';
import { EventTarget, Event } from 'event-target-shim';
import { collectEsmImports, loadModule, mapModuleValues } from '../mdx/imports';
import {
  ASTNode,
  DependencyUpdateInfo,
  ModuleImportDefinition,
  ModuleImportMapping,
  ModuleImportInfo,
  RenderParamsUpdateInfo,
  ImportDefinition,
  RefreshModuleEvent,
  ParsedImportStatement,
} from '../types';
import { transpileCode } from './transpileCode';

const intersection = <T extends string | number>(
  a: readonly T[],
  b: readonly T[],
): T[] => {
  return a.filter((v) => b.includes(v));
};

const checkImportDeps = (
  def: ImportDefinition,
  affectedVal: readonly string[],
): boolean => {
  return (
    // namespace import has dynamic references so evaluate every times
    (def.namespace && affectedVal.length > 0) ||
    def.named.some((v) => affectedVal.includes(v))
  );
};

const stripUrlParam = (url: string): string => url.split('?', 1)[0];

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

const eventName = Symbol('eventName');
type LazyCustomEvent = {
  (): CustomEvent;
  [eventName]: string;
};

export class DependencyManager<ID extends string> extends EventTarget<{
  dependencyUpdate: DependencyUpdateEvent<ID>;
  moduleUpdate: ModuleUpdateEvent<ID>;
  renderParamsUpdate: RenderParamsUpdateEvent<ID>;
}> {
  private mdxPath: string;
  private depsRootPath: string;
  private moduleLoader: (specifier: string) => Promise<unknown>;
  private miraBrickImportDef = {} as Record<ID, readonly ImportDefinition[]>;
  private miraBrickExportDef = {} as Record<ID, readonly string[]>;
  private miraBrickDefaultFunctionParams = {} as Record<
    ID,
    readonly string[] | null
  >;
  private miraBrickDependencyError = {} as Record<ID, Error>;
  private miraBrickModuleImportDef = {} as Record<ID, ModuleImportDefinition>;
  private miraBrickModuleImportError = {} as Record<ID, Error>;
  private miraBrickSnippetSource = {} as Record<ID, string>;
  private miraExportVal: Map<string, unknown> = new Map();
  private miraExportSource: Map<string, string> = new Map();
  private miraValDependency: Record<string, Set<string>> = {};
  private miraDefinedValues: Set<string> = new Set();
  private moduleImportMapping: Record<string, ModuleImportMapping> = {};
  private moduleProperties: Record<string, Set<string>> = {};
  private blockingEvaluateSemaphore = 0;
  private blockingUpdateEvent: (CustomEvent | LazyCustomEvent)[] = [];

  constructor({
    mdxPath,
    depsRootPath,
    moduleLoader,
  }: {
    mdxPath: string;
    depsRootPath: string;
    moduleLoader: (specifier: string) => Promise<unknown>;
  }) {
    super();
    this.mdxPath = mdxPath;
    this.depsRootPath = depsRootPath;
    this.moduleLoader = moduleLoader;
  }

  private dispatch(...events: (CustomEvent | LazyCustomEvent)[]) {
    const allEvents = [...this.blockingUpdateEvent, ...events];
    this.blockingUpdateEvent = [];
    const eventNames = allEvents.map(
      (e) => eventName in e && (e as LazyCustomEvent)[eventName],
    );
    allEvents.forEach((event, index) => {
      if (
        eventName in event &&
        eventNames.lastIndexOf((event as LazyCustomEvent)[eventName]) !== index
      ) {
        // Only runs the last one if multiple events with same name in a stack
        return;
      }
      this.dispatchEvent(typeof event === 'function' ? event() : event);
    });
  }

  private effectDependency(id: ID) {
    const lazyEvent = (() => {
      const resolvedValues = Object.entries(
        [...this.miraExportVal.keys()].reduce((acc, key) => {
          const source = this.miraExportSource.get(key);
          if (!source) {
            return acc;
          }
          if (source in acc) {
            acc[source].push(key);
          } else {
            acc[source] = [key];
          }
          return acc;
        }, {} as Record<string, string[]>),
      );
      const importDefinitions = (
        Object.entries(this.miraBrickModuleImportDef) as [
          ID,
          ModuleImportDefinition,
        ][]
      ).flatMap(([id, def]) =>
        this.miraBrickModuleImportError[id] ? [] : def.importDefinition,
      );
      return new CustomEvent<'dependencyUpdate', DependencyUpdateInfo<ID>>(
        'dependencyUpdate',
        {
          detail: {
            id,
            resolvedValues,
            importDefinitions,
            dependencyError: this.miraBrickDependencyError[id],
          },
        },
      );
    }) as LazyCustomEvent;
    lazyEvent[eventName] = `dependencyUpdate:${id}`;
    if (this.blockingEvaluateSemaphore > 0) {
      this.blockingUpdateEvent.push(lazyEvent);
    } else {
      this.dispatch(lazyEvent);
    }
  }

  private effectDefaultFunctionParams(id: ID) {
    const lazyEvent = (() => {
      const params = new Map<string, unknown>();
      this.miraBrickDefaultFunctionParams[id]?.forEach((p) => {
        if (this.miraExportVal.has(p)) {
          params.set(p, this.miraExportVal.get(p));
        }
      });
      return new CustomEvent<'renderParamsUpdate', RenderParamsUpdateInfo<ID>>(
        'renderParamsUpdate',
        {
          detail: {
            id,
            params: params,
          },
        },
      );
    }) as LazyCustomEvent;
    lazyEvent[eventName] = `renderParamsUpdate:${id}`;
    if (this.blockingEvaluateSemaphore > 0) {
      this.blockingUpdateEvent.push(lazyEvent);
    } else {
      this.dispatch(lazyEvent);
    }
  }

  private effectModuleUpdate() {
    this.dispatchEvent(
      new CustomEvent<'moduleUpdate', ModuleImportInfo<ID>>('moduleUpdate', {
        detail: {
          importMapping: { ...this.moduleImportMapping },
          importDef: { ...this.miraBrickModuleImportDef },
          importError: { ...this.miraBrickModuleImportError },
        },
      }),
    );
  }

  private clearBrickItem(id: ID) {
    const disposableSource = this.miraBrickSnippetSource[id];
    delete this.miraBrickImportDef[id];
    delete this.miraBrickExportDef[id];
    delete this.miraBrickDefaultFunctionParams[id];
    delete this.miraBrickSnippetSource[id];
    delete this.miraBrickDependencyError[id];
    delete this.miraBrickModuleImportDef[id];
    delete this.miraBrickModuleImportError[id];
    if (disposableSource) {
      URL.revokeObjectURL(disposableSource);
    }
  }

  async deferUpdateEvent(fn: () => Promise<void>) {
    this.blockingEvaluateSemaphore += 1;
    try {
      await fn();
    } finally {
      this.blockingEvaluateSemaphore -= 1;
    }
    if (this.blockingEvaluateSemaphore <= 0) {
      this.dispatch();
    }
  }

  pauseUpdateEvent() {
    this.blockingEvaluateSemaphore += 1;
  }

  resumeUpdateEvent() {
    this.blockingEvaluateSemaphore -= 1;
    if (this.blockingEvaluateSemaphore <= 0) {
      this.dispatch();
    }
  }

  async upsertSnippet(id: ID, code: string) {
    const traverseRef = (
      depsVal: readonly string[],
      exportVal: readonly string[],
      refMemo: readonly string[] = [],
    ): string[] => {
      const cyclicRefVal = intersection(depsVal, exportVal);
      if (cyclicRefVal.length > 0) {
        throw new Error(
          `Cyclic reference was found. Please check the exporting value: ${cyclicRefVal.join(
            ', ',
          )}`,
        );
      }
      const memo = [...depsVal, ...refMemo];
      return [
        ...depsVal,
        ...depsVal.flatMap((v) =>
          v in this.miraValDependency && !(v in refMemo)
            ? traverseRef([...this.miraValDependency[v]], exportVal, memo)
            : [],
        ),
      ];
    };

    const prevExports = this.miraBrickExportDef[id] ?? [];
    let nextImports: readonly ImportDefinition[] = [];
    let nextExports: readonly string[] = [];
    let nextDefaultParams: readonly string[] | null = null;
    try {
      const transformed = await transpileCode({
        code,
        bundle: false,
        sourcemap: false,
      });
      const transformedCode = transformed.text;
      if (transformed.errorObject || typeof transformedCode !== 'string') {
        // Failed to transform
        throw new Error('Failed to parse code');
      }
      const [declaration, [imports, exports]] = await Promise.all([
        scanDeclarations(transformedCode),
        scanModuleSpecifier(transformedCode),
      ] as const);
      const importDef = imports.flatMap(
        (imp) => parseImportStatement(transformedCode, imp) ?? [],
      );
      const namedImportVal = importDef.flatMap((def) => def.named);
      const namedExportVal = exports.filter((val) => val !== 'default');

      const anyAlreadyDefinedValue = namedExportVal.find(
        (val) =>
          (this.miraDefinedValues.has(val) && !prevExports.includes(val)) ||
          namedImportVal.includes(val),
      );
      if (anyAlreadyDefinedValue) {
        throw new Error(`Value ${anyAlreadyDefinedValue} has already defined`);
      }

      const deps = traverseRef(namedImportVal, namedExportVal);
      namedExportVal.forEach((val) => {
        this.miraValDependency[val] = new Set(deps);
      });
      nextImports = importDef;
      nextExports = namedExportVal;

      const defaultExport = declaration.exportDeclarations.find(
        (e): e is ExportDefaultDeclaration =>
          e.type === 'ExportDefaultDeclaration',
      );
      if (defaultExport) {
        const { declaration } = defaultExport;
        if (
          declaration.type === 'FunctionDeclaration' ||
          declaration.type === 'FunctionExpression' ||
          declaration.type === 'ArrowFunctionExpression'
        ) {
          const [firstParam] = declaration.params;
          let defaultParams: string[] = [];
          if (firstParam) {
            const properties =
              firstParam.type === 'ObjectPattern'
                ? firstParam.properties
                : firstParam.type === 'AssignmentPattern' &&
                  firstParam.left.type === 'ObjectPattern'
                ? firstParam.left.properties
                : [];
            defaultParams = properties.flatMap((p) =>
              p.type === 'Property' && p.key.type === 'Identifier'
                ? [p.key.name]
                : [],
            );
          }
          nextDefaultParams = defaultParams;
        }
      }
      delete this.miraBrickDependencyError[id];
    } catch (error) {
      this.miraBrickDependencyError[id] =
        error instanceof Error ? error : new Error();
    }
    const removedVal = prevExports.filter((v) => !nextExports.includes(v));
    nextExports.forEach((val) => this.miraDefinedValues.add(val));
    removedVal.forEach((val) => {
      this.miraDefinedValues.delete(val);
      this.miraExportVal.delete(val);
      this.miraExportSource.delete(val);
      delete this.miraValDependency[val];
    });
    this.miraBrickImportDef[id] = nextImports;
    this.miraBrickExportDef[id] = nextExports;
    this.miraBrickDefaultFunctionParams[id] = nextDefaultParams;

    this.effectDependency(id);
    this.effectDefaultFunctionParams(id);
    if (removedVal.length > 0) {
      (
        Object.entries(this.miraBrickImportDef) as [
          ID,
          readonly ImportDefinition[],
        ][]
      ).forEach(([id_, imports]) => {
        if (imports.some((def) => checkImportDeps(def, removedVal))) {
          this.effectDependency(id_);
        }
      });
      (
        Object.entries(this.miraBrickDefaultFunctionParams) as [
          ID,
          readonly string[] | null,
        ][]
      ).forEach(([id_, params]) => {
        if (params?.some((p) => removedVal.includes(p))) {
          this.effectDefaultFunctionParams(id_);
        }
      });
    }
  }

  deleteSnippet(id: ID) {
    const exports = this.miraBrickExportDef[id] ?? [];
    const dependencySets = Object.values(this.miraValDependency);
    exports.forEach((val) => {
      dependencySets.forEach((set) => set.delete(val));
      this.miraDefinedValues.delete(val);
      this.miraExportVal.delete(val);
      this.miraExportSource.delete(val);
      delete this.miraValDependency[val];
    });
    this.clearBrickItem(id);

    (
      Object.entries(this.miraBrickImportDef) as [
        ID,
        readonly ImportDefinition[],
      ][]
    ).forEach(([id_, imports]) => {
      if (imports.some((def) => checkImportDeps(def, exports))) {
        this.effectDependency(id_);
      }
    });
    (
      Object.entries(this.miraBrickDefaultFunctionParams) as [
        ID,
        readonly string[] | null,
      ][]
    ).forEach(([id_, params]) => {
      if (params?.some((p) => exports.includes(p))) {
        this.effectDefaultFunctionParams(id_);
      }
    });
  }

  updateSnippetExports(
    id: ID,
    source: string,
    exportVal: Map<string, unknown>,
  ) {
    const disposableSource = this.miraBrickSnippetSource[id];
    this.miraBrickSnippetSource[id] = source;
    const changedVal = [...exportVal.entries()]
      .filter(
        ([k, v]) =>
          !this.miraExportVal.has(k) || v !== this.miraExportVal.get(k),
      )
      .map(([k]) => k);
    const nextExportVal = new Map([...this.miraExportVal, ...exportVal]);
    this.miraExportVal = nextExportVal;
    exportVal.forEach((_, k) => {
      this.miraExportSource.set(k, source);
    });

    (
      Object.entries(this.miraBrickImportDef) as [
        ID,
        readonly ImportDefinition[],
      ][]
    ).forEach(([id, maps]) => {
      if (maps.some((def) => checkImportDeps(def, changedVal))) {
        this.effectDependency(id);
      }
    });
    (
      Object.entries(this.miraBrickDefaultFunctionParams) as [
        ID,
        readonly string[] | null,
      ][]
    ).forEach(([id, params]) => {
      if (params?.some((p) => changedVal.includes(p))) {
        this.effectDefaultFunctionParams(id);
      }
    });
    if (disposableSource) {
      URL.revokeObjectURL(disposableSource);
    }
  }

  upsertScript(id: ID, scriptNode: ASTNode[]) {
    this.deferUpdateEvent(async () => {
      let esmImports: ParsedImportStatement[] = [];
      let mapping: ReturnType<typeof mapModuleValues> = {};
      try {
        esmImports = await collectEsmImports({
          node: scriptNode,
          depsRootPath: this.depsRootPath,
          contextPath: this.mdxPath,
        });
        const importResults = await Promise.all(
          esmImports.map(async (definition) => {
            return {
              definition,
              mod: await loadModule({
                specifier: definition.specifier,
                moduleLoader: this.moduleLoader,
              }),
            };
          }),
        );
        importResults.forEach(({ definition, mod }) => {
          this.moduleProperties[stripUrlParam(definition.specifier)] = new Set(
            Object.keys(mod),
          );
        });
        mapping = importResults.reduce(
          (acc, { definition }) => ({
            ...acc,
            ...mapModuleValues({
              definition,
              moduleProperties:
                this.moduleProperties[stripUrlParam(definition.specifier)],
            }),
          }),
          mapping,
        );
        delete this.miraBrickModuleImportError[id];
      } catch (error) {
        if (error instanceof Error) {
          this.miraBrickModuleImportError[id] = error;
        }
      }
      const prevModuleMappedName =
        this.miraBrickModuleImportDef[id]?.mappedName ?? [];
      this.miraBrickModuleImportDef[id] = {
        mappedName: Object.keys(mapping),
        importDefinition: esmImports,
      };
      if (
        // Checking changes of moduleVal
        Object.entries(mapping).some(
          ([name, mapping]) =>
            !(name in this.moduleImportMapping) ||
            mapping.name !== this.moduleImportMapping[name].name ||
            mapping.specifier !== this.moduleImportMapping[name].specifier,
        ) ||
        prevModuleMappedName.some((name) => !(name in mapping))
      ) {
        const prevImportMapping = { ...this.moduleImportMapping };
        prevModuleMappedName.forEach((name) => {
          delete prevImportMapping[name];
        });

        this.moduleImportMapping = Object.keys(mapping).reduce(
          (acc, k) => ({
            ...acc,
            [k]: {
              ...mapping[k],
              url: stripUrlParam(mapping[k].specifier),
            },
          }),
          prevImportMapping,
        );
      }
      this.effectModuleUpdate();

      (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
        this.effectDependency(id);
      });
    });
  }

  deleteScript(id: ID) {
    this.deferUpdateEvent(async () => {
      const mappedName = this.miraBrickModuleImportDef[id]?.mappedName ?? [];
      if (mappedName.every((name) => !(name in this.moduleImportMapping))) {
        return;
      }
      const nextImportMapping = { ...this.moduleImportMapping };
      mappedName.forEach((name) => {
        delete nextImportMapping[name];
      });
      this.moduleImportMapping = nextImportMapping;
      this.clearBrickItem(id);
      this.effectModuleUpdate();

      (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
        this.effectDependency(id);
      });
    });
  }

  refreshModule({
    url: refreshedModuleUrl,
    module,
    viteUpdate,
  }: RefreshModuleEvent) {
    this.deferUpdateEvent(async () => {
      const url = stripUrlParam(refreshedModuleUrl);
      const nextSpecifier = (() => {
        const { origin, pathname, search, hash } = new URL(refreshedModuleUrl);
        let s = search;
        const newTimestampQuery = `t=${viteUpdate.timestamp}`;
        const timestampQueryMatch = s.match(/(t=\d+)/);
        if (timestampQueryMatch) {
          const { index, 1: str } = timestampQueryMatch;
          s =
            s.slice(0, index ?? 0) +
            newTimestampQuery +
            s.slice((index ?? 0) + str.length);
        } else {
          s += (s ? '&' : '?') + newTimestampQuery;
        }
        return `${origin}${pathname}${s}${hash}`;
      })();

      const affectedModuleImportDef = (
        Object.entries(this.miraBrickModuleImportDef) as [
          ID,
          ModuleImportDefinition,
        ][]
      ).filter(([, { importDefinition }]) =>
        importDefinition.some((s) => stripUrlParam(s.specifier) === url),
      );
      if (affectedModuleImportDef.length === 0) {
        return;
      }

      this.moduleProperties[stripUrlParam(nextSpecifier)] = new Set(
        Object.keys((module ?? {}) as Record<string, unknown>),
      );

      let nextImportMapping = { ...this.moduleImportMapping };
      affectedModuleImportDef.forEach(
        ([id, { mappedName, importDefinition }]) => {
          let mapping: ReturnType<typeof mapModuleValues> = {};
          mappedName.forEach((name) => {
            delete nextImportMapping[name];
          });
          const nextImportDefinition = importDefinition.map((definition) =>
            stripUrlParam(definition.specifier) === url
              ? { ...definition, specifier: nextSpecifier }
              : definition,
          );
          try {
            mapping = nextImportDefinition.reduce(
              (acc, definition) => ({
                ...acc,
                ...mapModuleValues({
                  moduleProperties:
                    this.moduleProperties[stripUrlParam(definition.specifier)],
                  definition,
                }),
              }),
              mapping,
            );
            delete this.miraBrickModuleImportError[id];
          } catch (error) {
            if (error instanceof Error) {
              this.miraBrickModuleImportError[id] = error;
            }
          }
          nextImportMapping = Object.keys(mapping).reduce(
            (acc, k) => ({
              ...acc,
              [k]: {
                ...mapping[k],
                url: stripUrlParam(mapping[k].specifier),
              },
            }),
            nextImportMapping,
          );
          this.miraBrickModuleImportDef[id] = {
            mappedName: Object.keys(mapping),
            importDefinition: nextImportDefinition,
          };
        },
      );
      this.moduleImportMapping = nextImportMapping;
      this.effectModuleUpdate();

      (Object.keys(this.miraBrickSnippetSource) as ID[]).forEach((id) => {
        this.effectDependency(id);
      });
    });
  }
}
