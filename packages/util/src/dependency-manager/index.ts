import { scanDeclarations } from '../declaration-parser';
import { ExportDefaultDeclaration } from '../declaration-parser/types';
import { parseImportStatement, scanModuleSpecifier } from '../ecma-import';
import { ImportDefinition } from '../ecma-import/types';
import { TranspileOptions } from './types';

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

export class DependencyManager<ID extends string | number = string | number> {
  _snippetImportDef = {} as Record<ID, readonly ImportDefinition[]>;
  _snippetExportDef = {} as Record<ID, readonly string[]>;
  _snippetHasDefaultExport = {} as Record<ID, boolean>;
  _snippetDefaultFunctionParams = {} as Record<ID, readonly string[] | null>;
  _snippetSource = {} as Record<ID, string>;
  _snippetDependencyError = {} as Record<ID, Error>;
  _exportVal: Map<string, unknown> = new Map();
  _exportSource: Map<string, string> = new Map();
  _valDependency: Record<string, Set<string>> = {};
  _definedValues: Set<string> = new Set();

  transpiler: (input: string, options?: TranspileOptions) => Promise<string>;
  onDependencyUpdate?: (id: ID) => void;
  onRenderParamsUpdate?: (id: ID) => void;
  onSourceRevoke?: (source: string) => void;
  throwsOnTaskFail: boolean;

  constructor({
    transpiler,
    onDependencyUpdate,
    onRenderParamsUpdate,
    onSourceRevoke,
    throwsOnTaskFail = false,
  }: {
    transpiler: (input: string, options?: TranspileOptions) => Promise<string>;
    onDependencyUpdate?: (id: ID) => void;
    onRenderParamsUpdate?: (id: ID) => void;
    onSourceRevoke?: (source: string) => void;
    throwsOnTaskFail?: boolean;
  }) {
    this.transpiler = transpiler;
    this.onDependencyUpdate = onDependencyUpdate;
    this.onRenderParamsUpdate = onRenderParamsUpdate;
    this.onSourceRevoke = onSourceRevoke;
    this.throwsOnTaskFail = throwsOnTaskFail;
  }

  protected _taskChain = Promise.resolve();
  protected _taskAwaiting = new Map<string, () => Promise<void>>();
  protected _taskBlockingSemaphore = 0;
  protected _pausedTask: (() => void) | undefined;
  protected serialTask(taskId: string, fn: () => Promise<void>): Promise<void> {
    const taskName = fn.name;
    const task = {
      [taskName]: async (): Promise<void> => {
        if (this._taskAwaiting.get(taskId) !== task) {
          return;
        }
        if (this._taskBlockingSemaphore > 0) {
          return new Promise<void>((res) => {
            this._pausedTask = res;
          }).then(task);
        }
        await fn();
        this._taskAwaiting.delete(taskId);
      },
    }[taskName];
    this._taskAwaiting.set(taskId, task);
    this._taskChain = this.throwsOnTaskFail
      ? this._taskChain.then(task)
      : this._taskChain.then(task).catch((error) => {
          console.error(error);
        });
    return this._taskChain;
  }

  pauseTask(): () => void {
    this._taskBlockingSemaphore += 1;
    return () => {
      this._taskBlockingSemaphore -= 1;
      if (this._taskBlockingSemaphore <= 0) {
        this._pausedTask?.();
        this._pausedTask = undefined;
      }
    };
  }

  protected clearSnippetData(id: ID) {
    const disposableSource = this._snippetSource[id];
    delete this._snippetImportDef[id];
    delete this._snippetExportDef[id];
    delete this._snippetHasDefaultExport[id];
    delete this._snippetDefaultFunctionParams[id];
    delete this._snippetSource[id];
    delete this._snippetDependencyError[id];
    if (disposableSource) {
      this.onSourceRevoke?.(disposableSource);
    }
  }

  upsertSnippet(id: ID, code: string): Promise<void> {
    return this.serialTask(
      `snippetChange:${id}`,
      function upsertSnippet(this: DependencyManager<ID>) {
        return this._upsertSnippet(id, code);
      }.bind(this),
    );
  }
  private async _upsertSnippet(id: ID, code: string) {
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
          v in this._valDependency && !(v in refMemo)
            ? traverseRef([...this._valDependency[v]], exportVal, memo)
            : [],
        ),
      ];
    };

    const prevExports = this._snippetExportDef[id] ?? [];
    let nextImports: readonly ImportDefinition[] = [];
    let nextExports: readonly string[] = [];
    let nextDefaultParams: readonly string[] | null = null;
    let hasDefaultExport = false;
    try {
      const transformedCode = await this.transpiler(code);
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
          (this._definedValues.has(val) && !prevExports.includes(val)) ||
          namedImportVal.includes(val),
      );
      if (anyAlreadyDefinedValue) {
        throw new Error(`Value ${anyAlreadyDefinedValue} has already defined`);
      }

      const deps = traverseRef(namedImportVal, namedExportVal);
      namedExportVal.forEach((val) => {
        this._valDependency[val] = new Set(deps);
      });
      nextImports = importDef;
      nextExports = namedExportVal;

      const defaultExport = declaration.exportDeclarations.find(
        (e): e is ExportDefaultDeclaration =>
          e.type === 'ExportDefaultDeclaration',
      );
      if (defaultExport) {
        hasDefaultExport = true;
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
      delete this._snippetDependencyError[id];
    } catch (error) {
      this._snippetDependencyError[id] =
        error instanceof Error ? error : new Error();
    }
    const removedVal = prevExports.filter((v) => !nextExports.includes(v));
    nextExports.forEach((val) => this._definedValues.add(val));
    removedVal.forEach((val) => {
      this._definedValues.delete(val);
      this._exportVal.delete(val);
      delete this._valDependency[val];
    });
    this._snippetImportDef[id] = nextImports;
    this._snippetExportDef[id] = nextExports;
    this._snippetDefaultFunctionParams[id] = nextDefaultParams;
    this._snippetHasDefaultExport[id] = hasDefaultExport;

    this.onDependencyUpdate?.(id);
    this.onRenderParamsUpdate?.(id);
    if (removedVal.length > 0) {
      (
        Object.entries(this._snippetImportDef) as [
          ID,
          readonly ImportDefinition[],
        ][]
      ).forEach(([id_, imports]) => {
        if (imports.some((def) => checkImportDeps(def, removedVal))) {
          this.onDependencyUpdate?.(id_);
        }
      });
      (
        Object.entries(this._snippetDefaultFunctionParams) as [
          ID,
          readonly string[] | null,
        ][]
      ).forEach(([id_, params]) => {
        if (params?.some((p) => removedVal.includes(p))) {
          this.onRenderParamsUpdate?.(id);
        }
      });
    }
  }

  deleteSnippet(id: ID): Promise<void> {
    return this.serialTask(
      `snippetChange:${id}`,
      function deleteSnippet(this: DependencyManager<ID>) {
        return this._deleteSnippet(id);
      }.bind(this),
    );
  }
  private async _deleteSnippet(id: ID) {
    const exports = this._snippetExportDef[id] ?? [];
    const dependencySets = Object.values(this._valDependency);
    exports.forEach((val) => {
      dependencySets.forEach((set) => set.delete(val));
      this._definedValues.delete(val);
      this._exportVal.delete(val);
      delete this._valDependency[val];
    });
    this.clearSnippetData(id);

    (
      Object.entries(this._snippetImportDef) as [
        ID,
        readonly ImportDefinition[],
      ][]
    ).forEach(([id_, imports]) => {
      if (imports.some((def) => checkImportDeps(def, exports))) {
        this.onDependencyUpdate?.(id_);
      }
    });
    (
      Object.entries(this._snippetDefaultFunctionParams) as [
        ID,
        readonly string[] | null,
      ][]
    ).forEach(([id_, params]) => {
      if (params?.some((p) => exports.includes(p))) {
        this.onRenderParamsUpdate?.(id_);
      }
    });
  }

  updateSnippetExports(
    id: ID,
    source: string,
    exportVal: Map<string, unknown>,
  ): Promise<void> {
    return this.serialTask(
      `snippetExportsChange:${id}`,
      function updateSnippetExports(this: DependencyManager<ID>) {
        return this._updateSnippetExports(id, source, exportVal);
      }.bind(this),
    );
  }
  private async _updateSnippetExports(
    id: ID,
    source: string,
    exportVal: Map<string, unknown>,
  ) {
    const disposableSource = this._snippetSource[id];
    this._snippetSource[id] = source;
    const changedVal = [...exportVal.entries()]
      .filter(
        ([k, v]) => !this._exportVal.has(k) || v !== this._exportVal.get(k),
      )
      .map(([k]) => k);
    const nextExportVal = new Map([...this._exportVal, ...exportVal]);
    this._exportVal = nextExportVal;
    exportVal.forEach((_, k) => {
      this._exportSource.set(k, source);
    });

    (
      Object.entries(this._snippetImportDef) as [
        ID,
        readonly ImportDefinition[],
      ][]
    ).forEach(([id, maps]) => {
      if (maps.some((def) => checkImportDeps(def, changedVal))) {
        this.onDependencyUpdate?.(id);
      }
    });
    (
      Object.entries(this._snippetDefaultFunctionParams) as [
        ID,
        readonly string[] | null,
      ][]
    ).forEach(([id, params]) => {
      if (params?.some((p) => changedVal.includes(p))) {
        this.onRenderParamsUpdate?.(id);
      }
    });
    if (disposableSource) {
      this.onSourceRevoke?.(disposableSource);
    }
  }
}
