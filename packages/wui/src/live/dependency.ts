import { parseImportStatement, scanModuleSpecifier } from '@mirajs/core';
import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';
import { EventTarget, Event } from 'event-target-shim';
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
  dependencyError: Error | undefined;
};
export type DependencyUpdateEvent = CustomEvent<
  'dependencyUpdate',
  DependencyUpdatePayload
>;

export class DependencyManager extends EventTarget<{
  dependencyUpdate: DependencyUpdateEvent;
}> {
  private miraBrickImportDef: Record<string, readonly ImportDefinition[]> = {};
  private miraBrickExportDef: Record<string, readonly string[]> = {};
  private miraBrickDependencyError: Record<string, Error> = {};
  private miraExportVal: Record<string, unknown> = {};
  private miraValDependency: Record<string, Set<string>> = {};
  private miraDefinedValues: Set<string> = new Set();
  private blockingEvaluateSemaphore = 0;
  private blockingUpdateEvent: DependencyUpdateEvent[] = [];

  private safeDispatch(payload: DependencyUpdatePayload) {
    const event = new CustomEvent('dependencyUpdate', {
      detail: payload,
    });
    if (this.blockingEvaluateSemaphore > 0) {
      this.blockingUpdateEvent.push(event);
    } else {
      this.dispatchEvent(event);
    }
  }

  async batchUpdate(fn: () => Promise<void>) {
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

    this.safeDispatch({
      id,
      exportVal: this.miraExportVal,
      dependencyError: this.miraBrickDependencyError[id],
    });
    if (removedVal.length > 0) {
      Object.entries(this.miraBrickImportDef).forEach(([id_, imports]) => {
        if (imports.some((def) => checkImportDeps(def, removedVal))) {
          this.safeDispatch({
            id: id_,
            exportVal: this.miraExportVal,
            dependencyError: this.miraBrickDependencyError[id_],
          });
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
        this.safeDispatch({
          id: id_,
          exportVal: this.miraExportVal,
          dependencyError: this.miraBrickDependencyError[id_],
        });
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
        this.safeDispatch({
          id,
          exportVal: newExportVal,
          dependencyError: this.miraBrickDependencyError[id],
        });
      }
    });
  }
}
