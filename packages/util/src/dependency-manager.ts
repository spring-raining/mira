import murmur from 'murmurhash-js';
import {
  defaultInitOption,
  defaultTransformOption,
} from './dependency-manager/transpiler';
import {
  DependencyUpdateEventData,
  ModuleImportData,
  ModuleUpdateEventData,
  RenderParamsUpdateEventData,
  SnippetData,
  SourceRevokeEventData,
} from './dependency-manager/types';
import {
  parseImportStatement,
  scanExportDeclaration,
  scanModuleSpecifier,
  stringifyImportDefinition,
} from './es-module';
import { ImportDefinition } from './es-module/types';
import {
  Message,
  MiraTranspilerBase,
  TransformFailure,
  TransformSuccess,
} from './types';

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

export class DependencyManager<
  ID extends string = string,
  InitOptions extends Record<string, unknown> = Record<string, unknown>,
  BuildOptions extends Record<string, unknown> = Record<string, unknown>,
  TransformOptions extends Record<string, unknown> = Record<string, unknown>,
  Transpiler extends MiraTranspilerBase<
    InitOptions,
    BuildOptions,
    TransformOptions
  > = MiraTranspilerBase<InitOptions, BuildOptions, TransformOptions>,
> {
  _snippetCode = {} as Record<ID, string>;
  _snippetData = {} as Record<ID, SnippetData>;
  _snippetSource = {} as Record<ID, string>;
  _snippetTransformResult = {} as Record<
    ID,
    TransformSuccess | TransformFailure
  >;
  _moduleImportData = {} as Record<ID, ModuleImportData>;
  _moduleImportError = {} as Record<ID, Error>;
  _exportVal: Map<string, unknown> = new Map();
  _valDependency: Record<string, Set<string>> = {};
  _definedValues: Set<string> = new Set();
  _transformedCache: Map<number, TransformSuccess | TransformFailure> =
    new Map();
  _importSpecifierMapping: Map<string, string> = new Map();

  private _transpiler: Transpiler;
  private _snippetSourceBuilder: (
    id: ID,
    snippet: string,
  ) => string | Promise<string>;
  private _moduleImportSpecifierBuilder: (
    originalSpecifier: string,
  ) => string | Promise<string>;
  private _getTranspilerInitOption: () => InitOptions | Promise<InitOptions>;
  private _getTranspilerBuildOption: (
    input: string,
  ) => BuildOptions | Promise<BuildOptions>;
  private _getTranspilerTransformOption: (
    input: string,
  ) => TransformOptions | Promise<TransformOptions>;
  private _onDependencyUpdate?: (event: DependencyUpdateEventData<ID>) => void;
  private _onModuleUpdate?: (event: ModuleUpdateEventData<ID>) => void;
  private _onRenderParamsUpdate?: (
    event: RenderParamsUpdateEventData<ID>,
  ) => void;
  private _onSourceRevoke?: (arg: SourceRevokeEventData<ID>) => void;
  throwsOnTaskFail: boolean;

  protected get _moduleSpecifiers(): Set<string> {
    return new Set(
      Object.values<ModuleImportData>(this._moduleImportData).flatMap(
        ({ importDefs }) => importDefs.map((def) => def.specifier),
      ),
    );
  }

  protected get _moduleExportValues(): Set<string> {
    return new Set(
      Object.values<ModuleImportData>(this._moduleImportData).flatMap(
        ({ exportValues }) => [...exportValues],
      ),
    );
  }

  constructor({
    transpiler,
    snippetSourceBuilder = (id) => `#${id}`,
    moduleImportSpecifierBuilder = (specifier) => specifier,
    transpilerInitOption = defaultInitOption as unknown as InitOptions,
    transpilerBuildOption = {} as BuildOptions,
    transpilerTransformOption = defaultTransformOption as unknown as TransformOptions,
    onDependencyUpdate,
    onModuleUpdate,
    onRenderParamsUpdate,
    onSourceRevoke,
    throwsOnTaskFail = false,
  }: {
    transpiler: Transpiler;
    snippetSourceBuilder?: (
      id: ID,
      snippet: string,
    ) => string | Promise<string>;
    moduleImportSpecifierBuilder?: (
      originalSpecifier: string,
    ) => string | Promise<string>;
    transpilerInitOption?:
      | InitOptions
      | (() => InitOptions | Promise<InitOptions>);
    transpilerBuildOption?:
      | BuildOptions
      | ((input: string) => BuildOptions | Promise<BuildOptions>);
    transpilerTransformOption?:
      | TransformOptions
      | ((input: string) => TransformOptions | Promise<TransformOptions>);
    onDependencyUpdate?: (event: DependencyUpdateEventData<ID>) => void;
    onModuleUpdate?: (event: ModuleUpdateEventData<ID>) => void;
    onRenderParamsUpdate?: (event: RenderParamsUpdateEventData<ID>) => void;
    onSourceRevoke?: (arg: SourceRevokeEventData<ID>) => void;
    throwsOnTaskFail?: boolean;
  }) {
    this._transpiler = transpiler;
    this._snippetSourceBuilder = snippetSourceBuilder;
    this._moduleImportSpecifierBuilder = moduleImportSpecifierBuilder;
    this._getTranspilerInitOption = () =>
      typeof transpilerInitOption === 'function'
        ? transpilerInitOption()
        : transpilerInitOption;
    this._getTranspilerBuildOption = (input: string) =>
      typeof transpilerBuildOption === 'function'
        ? transpilerBuildOption(input)
        : transpilerBuildOption;
    this._getTranspilerTransformOption = (input: string) =>
      typeof transpilerTransformOption === 'function'
        ? transpilerTransformOption(input)
        : transpilerTransformOption;
    this._onDependencyUpdate = onDependencyUpdate;
    this._onModuleUpdate = onModuleUpdate;
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
        this._onDependencyUpdate?.({
          id,
          transform: this._snippetTransformResult[id],
          snippet: this._snippetData[id],
          source: this._snippetSource[id],
        });
      }.bind(this),
    );
  }

  async dispatchModuleUpdate(id: ID): Promise<void> {
    return this.serialTask(
      `dispatchModuleUpdate:${id}`,
      async function dispatchModuleUpdate(this: DependencyManager<ID>) {
        this._onModuleUpdate?.({
          id,
          module: this._moduleImportData[id],
          error: this._moduleImportError[id],
        });
      }.bind(this),
    );
  }

  dispatchRenderParamsUpdate(id: ID): Promise<void> {
    return this.serialTask(
      `dispatchRenderParamsUpdate:${id}`,
      async function dispatchRenderParamsUpdate(this: DependencyManager<ID>) {
        this._onRenderParamsUpdate?.({ id });
      }.bind(this),
    );
  }

  dispatchSourceRevoke({
    id,
    source,
  }: {
    id: ID;
    source: string;
  }): Promise<void> {
    return this.serialTask(
      `dispatchSourceRevoke:${id}:${source}`,
      async function dispatchSourceRevoke(this: DependencyManager<ID>) {
        this._onSourceRevoke?.({ id, source });
      }.bind(this),
    );
  }

  protected clear(id: ID) {
    const disposableSource = this._snippetSource[id];
    delete this._snippetData[id];
    delete this._snippetSource[id];
    delete this._snippetTransformResult[id];
    delete this._snippetCode[id];
    delete this._moduleImportData[id];
    delete this._moduleImportError[id];
    if (disposableSource) {
      this.dispatchSourceRevoke({ id, source: disposableSource });
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
    this.clear(id);
    await this._calcDependency();
    this.dispatchDependencyUpdate(id);
  }

  updateSnippetExports(id: ID, exportVal: Map<string, unknown>): Promise<void> {
    return this.serialTask(
      `snippetExportsChange:${id}`,
      function updateSnippetExports(this: DependencyManager<ID>) {
        return this._updateSnippetExports(exportVal);
      }.bind(this),
    );
  }
  private async _updateSnippetExports(exportVal: Map<string, unknown>) {
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
  }

  upsertModule(
    id: ID,
    code: string | readonly ImportDefinition[],
  ): Promise<void> {
    return this.serialTask(
      `moduleChange:${id}`,
      function upsertModule(this: DependencyManager<ID>) {
        return this._upsertModule(id, code);
      }.bind(this),
    );
  }
  private async _upsertModule(
    id: ID,
    code: string | readonly ImportDefinition[],
  ) {
    try {
      let importDefs: readonly ImportDefinition[];
      if (typeof code === 'string') {
        const [imports] = await scanModuleSpecifier(code);
        importDefs = imports.flatMap(
          (imp) => parseImportStatement(code, imp) ?? [],
        );
      } else {
        importDefs = code;
      }
      const exportValues = new Set(
        importDefs.flatMap((def) => [
          ...Object.values(def.importBinding),
          ...(def.namespaceImport ? [def.namespaceImport] : []),
        ]),
      );
      this._moduleImportData[id] = { importDefs, exportValues };
    } catch (error) {
      if (error instanceof Error) {
        this._moduleImportError[id] = error;
      }
      await this._calcDependency();
      this.dispatchModuleUpdate(id);
      throw error;
    }
    await this._calcDependency();
    this.dispatchModuleUpdate(id);
  }

  deleteModule(id: ID): Promise<void> {
    return this.serialTask(
      `moduleChange:${id}`,
      function deleteModule(this: DependencyManager<ID>) {
        return this._deleteModule(id);
      }.bind(this),
    );
  }
  private async _deleteModule(id: ID) {
    this.clear(id);
    await this._calcDependency();
    this.dispatchModuleUpdate(id);
  }

  reloadModule(
    moduleMapFn: (mapping: Map<string, string>) => Map<string, string>,
  ): Promise<void> {
    return this.serialTask(
      `reloadModule`,
      function reloadModule(this: DependencyManager<ID>) {
        return this._reloadModule(moduleMapFn);
      }.bind(this),
    );
  }
  private async _reloadModule(
    moduleMapFn: (mapping: Map<string, string>) => Map<string, string>,
  ) {
    this._importSpecifierMapping = moduleMapFn(
      new Map(this._importSpecifierMapping),
    );
    await this._calcDependency();
  }

  protected async calcDependency() {
    return this.serialTask(
      `calcDependency`,
      function calcDependency(this: DependencyManager<ID>) {
        return this._calcDependency();
      }.bind(this),
    );
  }
  private async _calcDependency({
    firstCall = true,
  }: { firstCall?: boolean } = {}): Promise<Set<ID>> {
    let affectedSnippet = new Set<ID>();
    const codePre = await this.getDependencyImportCode();
    const settled = await Promise.allSettled(
      Object.entries<string>(this._snippetCode).map(async ([_id, code]) => {
        const id = _id as ID;
        try {
          let transformed = await this.transformCode(code);
          // Transform again and three-shaking import definitions
          if (!transformed.errorObject && codePre) {
            transformed = await this.transformCode(`${codePre}\n${code}`);
          }
          const inspectResult = await this.inspectSnippet(
            id,
            transformed.result.code,
          );
          if (
            inspectResult.transformedCode !==
            this._snippetData[id]?.transformedCode
          ) {
            affectedSnippet.add(id);
          }
          this._snippetTransformResult[id] = transformed;
          this._snippetData[id] = inspectResult;
          return inspectResult;
        } catch (error: any) {
          const errors: Message[] = 'errors' in error ? error.errors : [];
          const warnings: Message[] = 'warnings' in error ? error.warnings : [];
          this._snippetTransformResult[id] = {
            errorObject: error,
            errors,
            warnings,
          };
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
    if (firstError && this.throwsOnTaskFail) {
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

    await Promise.all(
      [...affectedSnippet].map(async (id: ID) => {
        await this.renewSnippetSource(
          id,
          this._snippetData[id]?.transformedCode,
        );
      }),
    );

    // Repeat calcDependency until a set of definedValues doesn't change
    if (
      affectedSnippet.size > 0 ||
      removedVal.length !== 0 ||
      addedVal.length !== 0
    ) {
      affectedSnippet = new Set([
        ...affectedSnippet,
        ...(await this._calcDependency({ firstCall: false })),
      ]);
    }
    if (firstCall) {
      [...affectedSnippet].map((id) => this.dispatchDependencyUpdate(id));
    }
    return affectedSnippet;
  }

  protected async getDependencyImportCode(): Promise<string | null> {
    const moduleImportDefs = Object.values<ModuleImportData>(
      this._moduleImportData,
    ).flatMap(({ importDefs }) => importDefs);
    const moduleImports = await Promise.all(
      moduleImportDefs.map(async (def) => {
        const mappedSpecifier =
          this._importSpecifierMapping.get(def.specifier) ??
          (await this._moduleImportSpecifierBuilder(def.specifier));
        this._importSpecifierMapping.set(def.specifier, mappedSpecifier);
        return stringifyImportDefinition({
          ...def,
          specifier: mappedSpecifier,
        });
      }),
    );
    const snippetImports = Object.entries<SnippetData>(this._snippetData)
      .filter(
        ([id, { exportValues }]) =>
          exportValues.size > 0 && this._snippetSource[id as ID],
      )
      .map(([id, { exportValues }]) =>
        stringifyImportDefinition({
          specifier: this._snippetSource[id as ID],
          named: [...exportValues],
        }),
      );
    return [...moduleImports, ...snippetImports].join('\n') || null;
  }

  protected async transformCode(code: string): Promise<TransformSuccess> {
    const cacheKey = murmur.murmur3(code);
    const cached = this._transformedCache.get(cacheKey);
    if (cached) {
      if (cached.errorObject) {
        throw cached.errorObject;
      } else {
        return cached;
      }
    }

    const transpiler = await this.getInitializedTranspiler();
    const option = await this._getTranspilerTransformOption(code);
    const transformed = await transpiler.transform(code, option);
    if (transformed.errorObject) {
      (transformed.errorObject as any).errors = transformed.errors;
      (transformed.errorObject as any).warnings = transformed.warnings;
      this._transformedCache.set(cacheKey, transformed);
      throw transformed.errorObject;
    }
    this._transformedCache.set(cacheKey, transformed);
    return transformed;
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
    const [[imports], exports] = await Promise.all([
      scanModuleSpecifier(code),
      scanExportDeclaration(code),
    ] as const);
    const importDefs = imports.flatMap(
      (imp) => parseImportStatement(code, imp) ?? [],
    );
    const moduleExportValues = this._moduleExportValues;
    const namedExportVal = [...exports].filter((val) => val !== 'default');

    const anyAlreadyDefinedValue = namedExportVal.find(
      (val) =>
        (this._definedValues.has(val) && !prevExports.has(val)) ||
        moduleExportValues.has(val),
    );
    if (anyAlreadyDefinedValue) {
      throw new Error(`Value ${anyAlreadyDefinedValue} has already defined`);
    }

    const moduleSpecifiers = this._moduleSpecifiers;
    const importSnippetVal = importDefs
      .filter((def) => !moduleSpecifiers.has(def.specifier))
      .flatMap((def) => def.named);
    const dependentValues = new Set(
      traverseRef(importSnippetVal, namedExportVal),
    );
    const dependentModuleSpecifiers = new Set(
      importDefs.map((def) => def.specifier),
    );

    const defaultFunctionParams: readonly string[] | null = null;
    const hasDefaultExport = exports.has('default');
    // const defaultExport = declaration.exportDeclarations.find(
    //   (e): e is ExportDefaultDeclaration =>
    //     e.type === 'ExportDefaultDeclaration',
    // );
    // if (defaultExport) {
    //   hasDefaultExport = true;
    //   const { declaration } = defaultExport;
    //   if (
    //     declaration.type === 'FunctionDeclaration' ||
    //     declaration.type === 'FunctionExpression' ||
    //     declaration.type === 'ArrowFunctionExpression'
    //   ) {
    //     const [firstParam] = declaration.params;
    //     let defaultParams: string[] = [];
    //     if (firstParam) {
    //       const properties =
    //         firstParam.type === 'ObjectPattern'
    //           ? firstParam.properties
    //           : firstParam.type === 'AssignmentPattern' &&
    //             firstParam.left.type === 'ObjectPattern'
    //           ? firstParam.left.properties
    //           : [];
    //       defaultParams = properties.flatMap((p) =>
    //         p.type === 'Property' && p.key.type === 'Identifier'
    //           ? [p.key.name]
    //           : [],
    //       );
    //     }
    //     defaultFunctionParams = defaultParams;
    //   }
    // }

    return {
      transformedCode: code,
      importDefs,
      exportValues: new Set(namedExportVal),
      dependentValues,
      dependentModuleSpecifiers,
      hasDefaultExport,
      defaultFunctionParams,
    };
  }

  protected async renewSnippetSource(id: ID, source: string | undefined) {
    const disposableSource = this._snippetSource[id];
    if (typeof source === 'string') {
      this._snippetSource[id] = await this._snippetSourceBuilder(id, source);
    } else {
      delete this._snippetSource[id];
    }
    if (disposableSource) {
      this.dispatchSourceRevoke({ id, source: disposableSource });
    }
  }

  protected async getInitializedTranspiler(): Promise<Transpiler> {
    if (!this._transpiler.isInitialized) {
      await this._transpiler.init(await this._getTranspilerInitOption());
    }
    return this._transpiler;
  }
}