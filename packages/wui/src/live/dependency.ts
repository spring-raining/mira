import {
  parseImportStatement,
  scanModuleSpecifier,
  scanDeclarations,
} from '@mirajs/core';
import type { ExportDefaultDeclaration } from '@mirajs/core/lib/declaration-parser/types';
import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';
import { EventTarget, Event } from 'event-target-shim';
import {
  collectEsmImports,
  loadModule,
  mapModuleValues,
  getRelativeSpecifier,
} from '../mdx/imports';
import {
  ASTNode,
  ModuleImportState,
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

class CustomEvent<T extends string, S> extends Event<T> {
  public detail: S;
  constructor(message: T, data: Event.EventInit & { detail: S }) {
    super(message, data);
    this.detail = data.detail;
  }
}

type DependencyUpdatePayload = {
  id: string;
  exportVal: Map<string, unknown>;
  moduleVal: Map<string, unknown>;
  importModules: [string, string[]][];
  dependencyError: Error | undefined;
};
export type DependencyUpdateEvent = CustomEvent<
  'dependencyUpdate',
  DependencyUpdatePayload
>;

export type ModuleUpdateEvent = CustomEvent<'moduleUpdate', ModuleImportState>;

export type RenderParamsUpdatePayload = {
  id: string;
  params: Map<string, unknown>;
};
export type RenderParamsUpdateEvent = CustomEvent<
  'renderParamsUpdate',
  RenderParamsUpdatePayload
>;

class ModuleCache {
  private cacheMap: Map<string, Record<string, unknown>> = new Map();
  private queryRe = /\?.*$/;
  private extRe = /\.[^/.]+$/;

  private stripKey(key: string): string {
    return key.replace(this.queryRe, '').replace(this.extRe, '');
  }

  get(key: string): Record<string, unknown> | undefined {
    return this.cacheMap.get(this.stripKey(key));
  }

  has(key: string): boolean {
    return this.cacheMap.has(this.stripKey(key));
  }

  set(key: string, value: Record<string, unknown>): this {
    this.cacheMap.set(this.stripKey(key), value);
    return this;
  }
}

export class DependencyManager extends EventTarget<{
  dependencyUpdate: DependencyUpdateEvent;
  moduleUpdate: ModuleUpdateEvent;
  renderParamsUpdate: RenderParamsUpdateEvent;
}> {
  private mdxPath: string;
  private depsRootPath: string;
  private moduleLoader: (specifier: string) => Promise<unknown>;
  private miraBrickImportDef: Record<string, readonly ImportDefinition[]> = {};
  private miraBrickExportDef: Record<string, readonly string[]> = {};
  private miraBrickDefaultFunctionParams: Record<
    string,
    readonly string[] | null
  > = {};
  private miraBrickDependencyError: Record<string, Error> = {};
  private miraBrickModuleImportDef: Record<
    string,
    {
      mappedName: readonly string[];
      importStatement: readonly ParsedImportStatement[];
    }
  > = {};
  private miraBrickModuleSource: Record<string, string> = {};
  private miraBrickModuleImportError: Record<string, Error> = {};
  private miraExportVal: Map<string, unknown> = new Map();
  private miraExportModule: Map<string, string> = new Map();
  private miraValDependency: Record<string, Set<string>> = {};
  private miraDefinedValues: Set<string> = new Set();
  private moduleCache: ModuleCache = new ModuleCache();
  private moduleVal: Map<string, unknown> = new Map();
  private moduleImportMapping: Record<
    string,
    {
      specifier: string;
      name: string | null;
    }
  > = {};
  private blockingEvaluateSemaphore = 0;
  private blockingUpdateEvent: DependencyUpdateEvent[] = [];

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

  private effectDependency(id: string) {
    const importModules = Object.entries(
      [...this.miraExportVal.keys()].reduce((acc, key) => {
        const source = this.miraExportModule.get(key);
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
    const event = new CustomEvent<'dependencyUpdate', DependencyUpdatePayload>(
      'dependencyUpdate',
      {
        detail: {
          id,
          importModules,
          exportVal: this.miraExportVal,
          moduleVal: this.moduleVal,
          dependencyError: this.miraBrickDependencyError[id],
        },
      },
    );
    if (this.blockingEvaluateSemaphore > 0) {
      this.blockingUpdateEvent.push(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  private effectDefaultFunctionParams(id: string) {
    const params = new Map<string, unknown>();
    this.miraBrickDefaultFunctionParams[id]?.forEach((p) => {
      if (this.miraExportVal.has(p)) {
        params.set(p, this.miraExportVal.get(p));
      } else if (this.moduleVal.has(p)) {
        params.set(p, this.moduleVal.get(p));
      }
    });
    const event = new CustomEvent<
      'renderParamsUpdate',
      RenderParamsUpdatePayload
    >('renderParamsUpdate', {
      detail: {
        id,
        params: params,
      },
    });
    this.dispatchEvent(event);
  }

  private effectModuleVal() {
    const nextModuleVal = Object.entries(this.moduleImportMapping).reduce(
      (acc, [name, mapping]) => {
        const mod = this.moduleCache.get(mapping.specifier);
        if (!mod) {
          return acc;
        }
        acc.set(name, mapping.name ? mod[mapping.name] : mod);
        return acc;
      },
      new Map<string, unknown>(),
    );
    this.moduleVal = nextModuleVal;
    // TODO
    // this.dispatchEvent(
    //   new CustomEvent<'moduleUpdate', ModuleImportState>('moduleUpdate', {
    //     detail: {
    //       mappedVal: { ...nextModuleVal },
    //       importDef: { ...this.miraBrickModuleImportDef },
    //       importError: { ...this.miraBrickModuleImportError },
    //     },
    //   }),
    // );
    Object.keys(this.miraBrickImportDef).forEach((id) => {
      this.effectDependency(id);
    });
    Object.keys(this.miraBrickDefaultFunctionParams).forEach((id) => {
      this.effectDefaultFunctionParams(id);
    });
  }

  async deferUpdateEvent(fn: () => Promise<void>) {
    this.blockingEvaluateSemaphore += 1;
    try {
      await fn();
    } finally {
      this.blockingEvaluateSemaphore -= 1;
    }
    if (this.blockingEvaluateSemaphore <= 0) {
      this.blockingUpdateEvent.forEach((e) => this.dispatchEvent(e));
      this.blockingUpdateEvent = [];
    }
  }

  async upsertCode(id: string, code: string) {
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
      this.miraExportModule.delete(val);
      delete this.miraValDependency[val];
    });
    this.miraBrickImportDef[id] = nextImports;
    this.miraBrickExportDef[id] = nextExports;
    this.miraBrickDefaultFunctionParams[id] = nextDefaultParams;

    this.effectDependency(id);
    this.effectDefaultFunctionParams(id);
    if (removedVal.length > 0) {
      Object.entries(this.miraBrickImportDef).forEach(([id_, imports]) => {
        if (imports.some((def) => checkImportDeps(def, removedVal))) {
          this.effectDependency(id_);
        }
      });
      Object.entries(this.miraBrickDefaultFunctionParams).forEach(
        ([id_, params]) => {
          if (params?.some((p) => removedVal.includes(p))) {
            this.effectDefaultFunctionParams(id_);
          }
        },
      );
    }
  }

  deleteCode(id: string) {
    const exports = this.miraBrickExportDef[id] ?? [];
    const dependencySets = Object.values(this.miraValDependency);
    exports.forEach((val) => {
      dependencySets.forEach((set) => set.delete(val));
      this.miraDefinedValues.delete(val);
      this.miraExportVal.delete(val);
      this.miraExportModule.delete(val);
      delete this.miraValDependency[val];
    });
    const source = this.miraBrickModuleSource[id];
    if (source) {
      URL.revokeObjectURL(source);
    }
    delete this.miraBrickImportDef[id];
    delete this.miraBrickExportDef[id];
    delete this.miraBrickDefaultFunctionParams[id];
    delete this.miraBrickModuleSource[id];
    delete this.miraBrickDependencyError[id];

    Object.entries(this.miraBrickImportDef).forEach(([id_, imports]) => {
      if (imports.some((def) => checkImportDeps(def, exports))) {
        this.effectDependency(id_);
      }
    });
    Object.entries(this.miraBrickDefaultFunctionParams).forEach(
      ([id_, params]) => {
        if (params?.some((p) => exports.includes(p))) {
          this.effectDefaultFunctionParams(id_);
        }
      },
    );
  }

  updateExports(id: string, source: string, exportVal: Map<string, unknown>) {
    this.miraBrickModuleSource[id] = source;
    const changedVal = [...exportVal.entries()]
      .filter(
        ([k, v]) =>
          !this.miraExportVal.has(k) || v !== this.miraExportVal.get(k),
      )
      .map(([k]) => k);
    const nextExportVal = new Map([...this.miraExportVal, ...exportVal]);
    this.miraExportVal = nextExportVal;
    exportVal.forEach((_, k) => {
      this.miraExportModule.set(k, source);
    });
    Object.entries(this.miraBrickImportDef).forEach(([id, maps]) => {
      if (maps.some((def) => checkImportDeps(def, changedVal))) {
        this.effectDependency(id);
      }
    });
    Object.entries(this.miraBrickDefaultFunctionParams).forEach(
      ([id, params]) => {
        if (params?.some((p) => changedVal.includes(p))) {
          this.effectDefaultFunctionParams(id);
        }
      },
    );
  }

  upsertScript(id: string, scriptNode: ASTNode[]) {
    this.deferUpdateEvent(async () => {
      let esmImports: ParsedImportStatement[] = [];
      let mapping: ReturnType<typeof mapModuleValues> = {};
      try {
        esmImports = await collectEsmImports({
          node: scriptNode,
          contextPath: this.mdxPath,
        });
        const importResults = await Promise.all(
          esmImports.map(async (definition) => {
            const mod = this.moduleCache.get(definition.specifier);
            return {
              definition,
              mod:
                mod ||
                (await loadModule({
                  specifier: definition.specifier,
                  moduleLoader: this.moduleLoader,
                  depsRootPath: this.depsRootPath,
                })),
            };
          }),
        );
        importResults.forEach(({ definition, mod }) => {
          this.moduleCache.set(definition.specifier, mod);
        });
        mapping = importResults.reduce(
          (acc, m) => ({
            ...acc,
            ...mapModuleValues(m),
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
        importStatement: esmImports,
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
        this.moduleImportMapping = {
          ...prevImportMapping,
          ...mapping,
        };
      }
      this.effectModuleVal();
    });
  }

  deleteScript(id: string) {
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
      this.effectModuleVal();
    });
  }

  refreshModule({ url, module }: RefreshModuleEvent) {
    const specifier = getRelativeSpecifier({
      url,
      depsRootPath: this.depsRootPath,
    });
    if (!this.moduleCache.has(specifier)) {
      return;
    }
    this.moduleCache.set(specifier, {
      ...(module as Record<string, unknown>),
    });

    let nextImportMapping = { ...this.moduleImportMapping };
    Object.entries(this.miraBrickModuleImportDef)
      .filter(([, { importStatement }]) =>
        importStatement.some((s) => s.specifier === specifier),
      )
      .forEach(([id, { mappedName, importStatement }]) => {
        let mapping: ReturnType<typeof mapModuleValues> = {};
        mappedName.forEach((name) => {
          delete nextImportMapping[name];
        });
        try {
          mapping = importStatement.reduce(
            (acc, definition) => ({
              ...acc,
              ...mapModuleValues({
                mod: this.moduleCache.get(definition.specifier) ?? {},
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
        nextImportMapping = {
          ...nextImportMapping,
          ...mapping,
        };
        this.miraBrickModuleImportDef[id] = {
          mappedName: Object.keys(mapping),
          importStatement,
        };
      });
    this.moduleImportMapping = nextImportMapping;
    this.effectModuleVal();
  }
}
