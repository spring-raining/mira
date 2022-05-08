import {
  parseImportStatement,
  scanModuleSpecifier,
  scanDeclarations,
} from '@mirajs/util';
import type { ExportDefaultDeclaration } from '@mirajs/util/dist/declaration-parser/types';
import { transpileCode } from './transpiler';
import { ImportDefinition } from './types';

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
  _snippetDependencyError = {} as Record<ID, Error>;
  _valDependency: Record<string, Set<string>> = {};
  _definedValues: Set<string> = new Set();

  private onDependencyUpdate?: (id: ID) => void;
  private onRenderParamsUpdate?: (id: ID) => void;

  constructor({
    onDependencyUpdate,
    onRenderParamsUpdate,
  }: {
    onDependencyUpdate?: (id: ID) => void;
    onRenderParamsUpdate?: (id: ID) => void;
  } = {}) {
    this.onDependencyUpdate = onDependencyUpdate;
    this.onRenderParamsUpdate = onRenderParamsUpdate;
  }

  clear(id: ID) {
    delete this._snippetImportDef[id];
    delete this._snippetExportDef[id];
    delete this._snippetHasDefaultExport[id];
    delete this._snippetDefaultFunctionParams[id];
    delete this._snippetDependencyError[id];
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

  deleteSnippet(id: ID) {
    const exports = this._snippetExportDef[id] ?? [];
    const dependencySets = Object.values(this._valDependency);
    exports.forEach((val) => {
      dependencySets.forEach((set) => set.delete(val));
      this._definedValues.delete(val);
      delete this._valDependency[val];
    });
    this.clear(id);

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
}
