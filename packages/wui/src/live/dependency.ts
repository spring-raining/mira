import { parseImportStatement, scanModuleSpecifier } from '@mirajs/core';
import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';
import { EventTarget, Event } from 'event-target-shim';
import { collectEsmImports, loadModule, mapModuleValues } from '../mdx/imports';
import { ASTNode, ModuleImportState } from '../types';
import { transpileCode } from './transpileCode';

const intersection = <T extends string | number>(
  a: readonly T[],
  b: readonly T[]
): T[] => {
  return a.filter((v) => b.includes(v));
};

const checkImportDeps = (
  def: ImportDefinition,
  affectedVal: readonly string[]
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
  exportVal: Record<string, unknown>;
  moduleVal: Record<string, unknown>;
  dependencyError: Error | undefined;
};
export type DependencyUpdateEvent = CustomEvent<
  'dependencyUpdate',
  DependencyUpdatePayload
>;

export type ModuleUpdateEvent = CustomEvent<'moduleUpdate', ModuleImportState>;

export class DependencyManager extends EventTarget<{
  dependencyUpdate: DependencyUpdateEvent;
  moduleUpdate: ModuleUpdateEvent;
}> {
  private mdxPath: string;
  private depsRootPath: string;
  private moduleLoader: (specifier: string) => Promise<unknown>;
  private miraBrickImportDef: Record<string, readonly ImportDefinition[]> = {};
  private miraBrickExportDef: Record<string, readonly string[]> = {};
  private miraBrickDependencyError: Record<string, Error> = {};
  private miraBrickModuleImportDef: Record<string, readonly string[]> = {};
  private miraBrickModuleImportError: Record<string, Error> = {};
  private miraExportVal: Record<string, unknown> = {};
  private miraValDependency: Record<string, Set<string>> = {};
  private miraDefinedValues: Set<string> = new Set();
  private moduleCache: Map<string, Record<string, unknown>> = new Map();
  private moduleVal: Record<string, unknown> = {};
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

  private refreshDependency(id: string) {
    const event = new CustomEvent('dependencyUpdate', {
      detail: {
        id,
        exportVal: this.miraExportVal,
        moduleVal: this.moduleVal,
        dependencyError: this.miraBrickDependencyError[id],
      },
    });
    if (this.blockingEvaluateSemaphore > 0) {
      this.blockingUpdateEvent.push(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  private refreshModuleVal() {
    const newModuleVal = Object.entries(this.moduleImportMapping).reduce(
      (acc, [name, mapping]) => {
        const mod = this.moduleCache.get(mapping.specifier);
        if (!mod) {
          return acc;
        }
        return {
          ...acc,
          [name]: mapping.name ? mod[mapping.name] : mod,
        };
      },
      {}
    );
    this.moduleVal = newModuleVal;
    this.dispatchEvent(
      new CustomEvent('moduleUpdate', {
        detail: {
          mappedVal: { ...newModuleVal },
          importDef: { ...this.miraBrickModuleImportDef },
          importError: { ...this.miraBrickModuleImportError },
        },
      })
    );
    Object.keys(this.miraBrickImportDef).forEach((id) => {
      this.refreshDependency(id);
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
      refMemo: readonly string[] = []
    ): string[] => {
      const cyclicRefVal = intersection(depsVal, exportVal);
      if (cyclicRefVal.length > 0) {
        throw new Error(
          `Cyclic reference was found. Please check the exporting value: ${cyclicRefVal.join(
            ', '
          )}`
        );
      }
      const memo = [...depsVal, ...refMemo];
      return [
        ...depsVal,
        ...depsVal.flatMap((v) =>
          v in this.miraValDependency && !(v in refMemo)
            ? traverseRef([...this.miraValDependency[v]], exportVal, memo)
            : []
        ),
      ];
    };

    const prevExports = this.miraBrickExportDef[id] ?? [];
    let nextImports: readonly ImportDefinition[] = [];
    let nextExports: readonly string[] = [];
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
      const [imports, exports] = await scanModuleSpecifier(transformedCode);
      const importDef = imports.flatMap(
        (imp) => parseImportStatement(transformedCode, imp) ?? []
      );
      const namedImportVal = importDef.flatMap((def) => def.named);
      const namedExportVal = exports.filter((val) => val !== 'default');

      const anyAlreadyDefinedValue = namedExportVal.find(
        (val) =>
          (this.miraDefinedValues.has(val) && !prevExports.includes(val)) ||
          namedImportVal.includes(val)
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
      delete this.miraBrickDependencyError[id];
    } catch (error) {
      this.miraBrickDependencyError[id] =
        error instanceof Error ? error : new Error();
    }
    const removedVal = prevExports.filter((v) => !nextExports.includes(v));
    nextExports.forEach((val) => this.miraDefinedValues.add(val));
    removedVal.forEach((val) => {
      this.miraDefinedValues.delete(val);
      delete this.miraExportVal[val];
      delete this.miraValDependency[val];
    });
    this.miraBrickImportDef[id] = nextImports;
    this.miraBrickExportDef[id] = nextExports;

    this.refreshDependency(id);
    if (removedVal.length > 0) {
      Object.entries(this.miraBrickImportDef).forEach(([id_, imports]) => {
        if (imports.some((def) => checkImportDeps(def, removedVal))) {
          this.refreshDependency(id_);
        }
      });
    }
  }

  deleteCode(id: string) {
    const exports = this.miraBrickExportDef[id] ?? [];
    const dependencySets = Object.values(this.miraValDependency);
    exports.forEach((val) => {
      dependencySets.forEach((set) => set.delete(val));
      this.miraDefinedValues.delete(val);
      delete this.miraExportVal[val];
      delete this.miraValDependency[val];
    });
    delete this.miraBrickImportDef[id];
    delete this.miraBrickExportDef[id];
    delete this.miraBrickDependencyError[id];

    Object.entries(this.miraBrickImportDef).forEach(([id_, imports]) => {
      if (imports.some((def) => checkImportDeps(def, exports))) {
        this.refreshDependency(id_);
      }
    });
  }

  updateExports(exportVal: Record<string, unknown>) {
    const changedVal = Object.entries(exportVal)
      .filter(
        ([k, v]) => !(k in this.miraExportVal) || v !== this.miraExportVal[k]
      )
      .map(([k]) => k);
    const newExportVal = { ...this.miraExportVal, ...exportVal };
    this.miraExportVal = newExportVal;
    Object.entries(this.miraBrickImportDef).forEach(([id, maps]) => {
      if (maps.some((def) => checkImportDeps(def, changedVal))) {
        this.refreshDependency(id);
      }
    });
  }

  upsertScript(id: string, scriptNode: ASTNode[]) {
    this.deferUpdateEvent(async () => {
      let mapping: ReturnType<typeof mapModuleValues> = {};
      try {
        const esmImports = await collectEsmImports({
          node: scriptNode,
          path: this.mdxPath,
        });
        const importResults = await Promise.all(
          esmImports.map(async (definition) => {
            const mod = this.moduleCache.get(definition.specifier);
            return {
              definition,
              mod:
                mod ||
                (await loadModule({
                  definition,
                  moduleLoader: this.moduleLoader,
                  depsRootPath: this.depsRootPath,
                })),
            };
          })
        );
        importResults.forEach(({ definition, mod }) => {
          this.moduleCache.set(definition.specifier, mod);
        });
        mapping = importResults.reduce(
          (acc, m) => ({
            ...acc,
            ...mapModuleValues(m),
          }),
          mapping
        );
        delete this.miraBrickModuleImportError[id];
      } catch (error) {
        if (error instanceof Error) {
          this.miraBrickModuleImportError[id] = error;
        }
      }
      const prevModuleImportDef = this.miraBrickModuleImportDef[id] ?? [];
      this.miraBrickModuleImportDef[id] = Object.keys(mapping);
      if (
        // Checking changes of moduleVal
        Object.entries(mapping).some(
          ([name, mapping]) =>
            !(name in this.moduleImportMapping) ||
            mapping.name !== this.moduleImportMapping[name].name ||
            mapping.specifier !== this.moduleImportMapping[name].specifier
        ) ||
        prevModuleImportDef.some((name) => !(name in mapping))
      ) {
        const prevImportMapping = { ...this.moduleImportMapping };
        prevModuleImportDef.forEach((name) => {
          delete prevImportMapping[name];
        });
        this.moduleImportMapping = {
          ...prevImportMapping,
          ...mapping,
        };
        this.refreshModuleVal();
      }
    });
  }

  deleteScript(id: string) {
    this.deferUpdateEvent(async () => {
      const moduleDef = this.miraBrickModuleImportDef[id] ?? [];
      if (moduleDef.every((name) => !(name in this.moduleImportMapping))) {
        return;
      }
      const newImportMapping = { ...this.moduleImportMapping };
      moduleDef.forEach((name) => {
        delete newImportMapping[name];
      });
      this.moduleImportMapping = newImportMapping;
      this.refreshModuleVal();
    });
  }
}
