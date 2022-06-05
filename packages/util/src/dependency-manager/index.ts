import { scanDeclarations } from '../declaration-parser';
import { ExportDefaultDeclaration } from '../declaration-parser/types';
import {
  parseImportStatement,
  scanModuleSpecifier,
  stringifyImportDefinition,
} from '../ecma-import';
import { ImportDefinition } from '../ecma-import/types';
import { MiraTranspilerBase } from '../types';
import { transformCode } from './transpiler';

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

interface SnippetData {
  transformedCode: string;
  importDefs: readonly ImportDefinition[];
  exportValues: Set<string>;
  dependentValues: Set<string>;
  hasDefaultExport: boolean;
  defaultFunctionParams: readonly string[] | null;
}

export class DependencyManager<ID extends string = string> {
  _snippetCode = {} as Record<ID, string>;
  _snippetData = {} as Record<ID, SnippetData>;
  _snippetSource = {} as Record<ID, string>;
  _snippetDependencyError = {} as Record<ID, Error>;
  _exportVal: Map<string, unknown> = new Map();
  _valDependency: Record<string, Set<string>> = {};
  _definedValues: Set<string> = new Set();

  transpiler: MiraTranspilerBase;
  private _onDependencyUpdate?: (id: ID) => void;
  private _onRenderParamsUpdate?: (id: ID) => void;
  private _onSourceRevoke?: (source: string) => void;
  throwsOnTaskFail: boolean;

  constructor({
    transpiler,
    onDependencyUpdate,
    onRenderParamsUpdate,
    onSourceRevoke,
    throwsOnTaskFail = false,
  }: {
    transpiler: MiraTranspilerBase;
    onDependencyUpdate?: (id: ID) => void;
    onRenderParamsUpdate?: (id: ID) => void;
    onSourceRevoke?: (source: string) => void;
    throwsOnTaskFail?: boolean;
  }) {
    this.transpiler = transpiler;
    this._onDependencyUpdate = onDependencyUpdate;
    this._onRenderParamsUpdate = onRenderParamsUpdate;
    this._onSourceRevoke = onSourceRevoke;
    this.throwsOnTaskFail = throwsOnTaskFail;
  }

  protected _taskChain = Promise.resolve();
  protected _taskAwaiting = new Map<string, () => Promise<void>>();
  protected _taskBlockingSemaphore = 0;
  protected _pausedTask: (() => void) | undefined;
  protected serialTask(
    taskId: string,
    fn: () => Promise<unknown>,
  ): Promise<void> {
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

  get taskPromise(): Promise<void> {
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

  async dispatchDependencyUpdate(id: ID): Promise<void> {
    return this.serialTask(
      `dispatchDependencyUpdate:${id}`,
      async function dispatchDependencyUpdate(this: DependencyManager<ID>) {
        this._onDependencyUpdate?.(id);
      }.bind(this),
    );
  }

  dispatchRenderParamsUpdate(id: ID): Promise<void> {
    return this.serialTask(
      `dispatchRenderParamsUpdate:${id}`,
      async function dispatchRenderParamsUpdate(this: DependencyManager<ID>) {
        this._onRenderParamsUpdate?.(id);
      }.bind(this),
    );
  }

  dispatchSourceRevoke(source: string): Promise<void> {
    return this.serialTask(
      `dispatchSourceRevoke:${source}`,
      async function dispatchSourceRevoke(this: DependencyManager<ID>) {
        this._onSourceRevoke?.(source);
      }.bind(this),
    );
  }

  protected clearSnippetData(id: ID) {
    const disposableSource = this._snippetSource[id];
    delete this._snippetData[id];
    delete this._snippetSource[id];
    delete this._snippetDependencyError[id];
    delete this._snippetCode[id];
    if (disposableSource) {
      this.dispatchSourceRevoke(disposableSource);
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
    this._snippetCode[id] = code;
    await this._calcDependency();
    this.dispatchDependencyUpdate(id);
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
    this.clearSnippetData(id);
    await this._calcDependency();
    this.dispatchDependencyUpdate(id);
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

    Object.entries<SnippetData>(this._snippetData).forEach(([_id, data]) => {
      const id = _id as ID;
      if (data.importDefs.some((def) => checkImportDeps(def, changedVal))) {
        this.dispatchDependencyUpdate(id);
      }
      if (data.defaultFunctionParams?.some((p) => changedVal.includes(p))) {
        this.dispatchRenderParamsUpdate(id);
      }
    });
    if (disposableSource) {
      this.dispatchSourceRevoke(disposableSource);
    }
  }

  protected async calcDependency() {
    return this.serialTask(
      `calcDependency`,
      function calcDependency(this: DependencyManager<ID>) {
        return this._calcDependency();
      }.bind(this),
    );
  }
  private async _calcDependency(firstCall = true): Promise<Set<ID>> {
    let affectedSnippet = new Set<ID>();
    const settled = await Promise.allSettled(
      Object.entries<string>(this._snippetCode).map(async ([_id, code]) => {
        const id = _id as ID;
        try {
          const inspectResult = await this.inspectSnippet(id, code);
          if (
            inspectResult.transformedCode !==
            this._snippetData[id]?.transformedCode
          ) {
            affectedSnippet.add(id);
          }
          this._snippetData[id] = inspectResult;
          delete this._snippetDependencyError[id];
          return inspectResult;
        } catch (error) {
          this._snippetDependencyError[id] =
            error instanceof Error ? error : new Error();
          if (this._snippetData[id]) {
            delete this._snippetData[id];
            affectedSnippet.add(id);
          }
          throw error;
        }
      }),
    );
    const firstError = settled
      .map((v) => v.status === 'rejected' && v.reason)
      .find((v) => !!v);
    if (firstError) {
      throw firstError;
    }

    const nextDefinedValues = new Set<string>();
    const nextValDependency: Record<string, Set<string>> = {};
    settled.forEach((v) => {
      if (v.status !== 'fulfilled') {
        return;
      }
      v.value.exportValues.forEach((val) => {
        nextDefinedValues.add(val);
        nextValDependency[val] = new Set(v.value.dependentValues);
      });
    });
    const prevDefined = [...this._definedValues];
    const nextDefined = [...nextDefinedValues];
    const removedVal = prevDefined.filter((v) => !nextDefined.includes(v));
    const addedVal = nextDefined.filter((v) => !prevDefined.includes(v));

    removedVal.forEach((val) => {
      this._exportVal.delete(val);
    });
    this._definedValues = nextDefinedValues;
    this._valDependency = nextValDependency;
    // Repeat calcDependency until a set of definedValues doesn't change
    if (
      affectedSnippet.size > 0 ||
      removedVal.length !== 0 ||
      addedVal.length !== 0
    ) {
      affectedSnippet = new Set([
        ...affectedSnippet,
        ...(await this._calcDependency(false)),
      ]);
    }
    if (firstCall) {
      [...affectedSnippet].map((id) => this.dispatchDependencyUpdate(id));
    }
    return affectedSnippet;
  }

  protected async transformWithDependencyContext(
    code: string,
  ): Promise<string> {
    const codePre = Object.entries<SnippetData>(this._snippetData)
      .filter(([, { exportValues }]) => exportValues.size > 0)
      .map(([id, { exportValues }]) =>
        stringifyImportDefinition({
          specifier: `#${id}`,
          named: [...exportValues],
        }),
      )
      .join('\n');
    const transformedCode = await transformCode({
      transpiler: this.transpiler,
      code: `${codePre}\n${code}`,
    });
    return transformedCode;
  }

  protected async inspectSnippet(id: ID, code: string): Promise<SnippetData> {
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

    const prevExports = this._snippetData[id]?.exportValues ?? new Set();
    const transformedCode = await this.transformWithDependencyContext(code);
    const [declaration, [imports, exports]] = await Promise.all([
      scanDeclarations(transformedCode),
      scanModuleSpecifier(transformedCode),
    ] as const);
    const importDefs = imports.flatMap(
      (imp) => parseImportStatement(transformedCode, imp) ?? [],
    );
    const namedImportVal = importDefs.flatMap((def) => def.named);
    const namedExportVal = exports.filter((val) => val !== 'default');

    const anyAlreadyDefinedValue = namedExportVal.find(
      (val) =>
        (this._definedValues.has(val) && !prevExports.has(val)) ||
        namedImportVal.includes(val),
    );
    if (anyAlreadyDefinedValue) {
      throw new Error(`Value ${anyAlreadyDefinedValue} has already defined`);
    }
    const dependentValues = new Set(
      traverseRef(namedImportVal, namedExportVal),
    );

    let defaultFunctionParams: readonly string[] | null = null;
    let hasDefaultExport = false;
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
        defaultFunctionParams = defaultParams;
      }
    }

    return {
      transformedCode,
      importDefs,
      exportValues: new Set(namedExportVal),
      dependentValues,
      hasDefaultExport,
      defaultFunctionParams,
    };
  }
}
