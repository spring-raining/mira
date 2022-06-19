import { init as initEsModuleLexer, parse } from 'es-module-lexer';
import stripComments from 'strip-comments';
import { parseModuleDeclarations } from './declaration-parser';
import { DestructuringPattern } from './declaration-parser/types';
import { ImportDefinition, ImportSpecifier } from './es-module/types';

// http://www.ecma-international.org/ecma-262/6.0/#sec-imports
/* eslint-disable no-useless-escape */
const importRe = /^import(?:(.+)from)?\s*('[^']+'|"[^"]+")[\s;]*$/;
const namedImportsRe = /^(?:([A-Za-z_$][^\s\{\}]*)\s*,)?\s*\{([^\}]+)\}$/;
const namespaceImportRe =
  /^(?:([A-Za-z_$][^\s\{\}]*)\s*,)?\s*\*\s+as\s+([A-Za-z_$][^\s\{\}]*)$/;
const defaultBindingRe = /^\s*([A-Za-z_$][^\s\{\}]*)\s*$/;
const importSpecifierRe =
  /^(?:([A-Za-z_$][^\s\{\}]*)\s+as\s+)?([A-Za-z_$][^\s\{\}]*)$/;
/* eslint-enable no-useless-escape */

export const parseImportClause = (
  importClause: string,
): Omit<ImportDefinition, 'specifier' | 'all'> | null => {
  const importBinding: { [key: string]: string } = {};
  const named: string[] = [];
  let namespaceImport: string | null = null;
  let hasDefaultImport = false;
  let hasNamespaceImport = false;

  const trimmed = importClause.trim();
  const namedImportsMatch = trimmed.match(namedImportsRe);
  const namespaceImportMatch = trimmed.match(namespaceImportRe);
  const defaultBindingMatch = trimmed.match(defaultBindingRe);

  if (namedImportsMatch) {
    const defaultImport = namedImportsMatch[1];
    const namedImports = namedImportsMatch[2].split(',');
    if (defaultImport) {
      hasDefaultImport = true;
      importBinding.default = defaultImport;
    }
    for (let i = 0; i < namedImports.length; i++) {
      const specifierMatch = namedImports[i].trim().match(importSpecifierRe);
      if (!specifierMatch) {
        return null;
      }
      const identifierName = specifierMatch[1];
      const importedBinding = specifierMatch[2];
      importBinding[identifierName || importedBinding] = importedBinding;
      named.push(identifierName || importedBinding);
    }
  } else if (namespaceImportMatch) {
    const defaultImport = namespaceImportMatch[1];
    if (defaultImport) {
      hasDefaultImport = true;
      importBinding.default = defaultImport;
    }
    hasNamespaceImport = true;
    namespaceImport = namespaceImportMatch[2];
  } else if (defaultBindingMatch) {
    hasDefaultImport = true;
    importBinding.default = defaultBindingMatch[1];
  } else {
    return null;
  }
  return {
    importBinding,
    namespaceImport,
    default: hasDefaultImport,
    namespace: hasNamespaceImport,
    named,
  };
};

// Deeply inspired by Snowpack's parser
// https://github.com/snowpackjs/snowpack/blob/main/snowpack/src/scan-imports.ts
export const parseImportStatement = (
  source: string,
  imp: ImportSpecifier,
): ImportDefinition | null => {
  if (
    imp.d === -2 || // import.meta
    imp.d > -1 // dynamic imports
  ) {
    return null;
  }
  const importStatement = stripComments(source.substring(imp.ss, imp.se));
  if (/^import\s+type/.test(importStatement)) {
    // type imports
    return null;
  }
  const specifier = source.substring(imp.s, imp.e);
  const matched = importStatement.trim().match(importRe);
  if (!matched) {
    return null;
  }
  const importClause = matched[1];
  if (importClause) {
    const bindingDef = parseImportClause(importClause);
    if (!bindingDef) {
      return null;
    }
    return {
      ...bindingDef,
      specifier,
      all: false,
    };
  } else {
    return {
      specifier,
      all: true,
      default: false,
      namespace: false,
      named: [],
      importBinding: {},
      namespaceImport: null,
    };
  }
};

export const scanModuleSpecifier = async (
  source: string,
): Promise<[readonly ImportSpecifier[], readonly string[], boolean]> => {
  await initEsModuleLexer;
  const [imports, exports, facade] = await parse(source);
  return [imports, exports, facade];
};

export const scanExportDeclaration = async (
  source: string,
): Promise<Set<string>> => {
  const { exportDeclarations } = await parseModuleDeclarations(source);

  const mapToIdentifierName = (pattern: DestructuringPattern): string[] => {
    if (pattern.type === 'Identifier') {
      return [pattern.name];
    }
    if (pattern.type === 'ArrayPattern') {
      return pattern.elements
        .filter((e): e is DestructuringPattern => !!e)
        .flatMap(mapToIdentifierName);
    }
    if (pattern.type === 'ObjectPattern') {
      return pattern.properties.flatMap((p) => {
        if (p.type === 'Property') {
          if (p.key.type === 'Identifier') {
            return p.key.name;
          } else if (
            p.key.type === 'Literal' &&
            typeof p.key.value === 'string'
          ) {
            return p.key.value;
          } else {
            // Ignore NumberLiteral
            return [];
          }
        }
        return mapToIdentifierName(p);
      });
    }
    if (pattern.type === 'AssignmentPattern') {
      return mapToIdentifierName(pattern.left);
    }
    if (pattern.type === 'RestElement') {
      return mapToIdentifierName(pattern.argument);
    }
    return [];
  };
  const identifiers = exportDeclarations.flatMap<string>((n) => {
    if (n.type === 'ExportNamedDeclaration') {
      let declarationVars: string[] = [];
      if (
        n.declaration?.type === 'ClassDeclaration' ||
        n.declaration?.type === 'ClassExpression' ||
        n.declaration?.type === 'FunctionDeclaration'
      ) {
        if (n.declaration.id?.name) {
          declarationVars.push(n.declaration.id.name);
        }
      }
      if (n.declaration?.type === 'VariableDeclaration') {
        n.declaration.declarations;
        declarationVars = n.declaration.declarations.flatMap((decr) =>
          mapToIdentifierName(decr.id),
        );
      }
      return [...declarationVars, ...n.specifiers.map((n) => n.exported.name)];
    }
    if (n.type === 'ExportAllDeclaration') {
      return n.exported ? n.exported.name : [];
    }
    if (n.type === 'ExportDefaultDeclaration') {
      return 'default';
    }
    return [];
  });
  return new Set(identifiers);
};

export const importModules = async (
  definitions: ImportDefinition[],
): Promise<Record<string, any>> => {
  const loadCache: Record<string, any> = {};
  let modules: Record<string, any> = {};
  for (const definition of definitions) {
    const { specifier, importBinding, namespaceImport } = definition;
    if (!(specifier in loadCache)) {
      loadCache[specifier] = await import(specifier);
    }
    const mod = loadCache[specifier];
    modules = Object.entries(importBinding).reduce<{
      [bind: string]: any;
    }>((acc, [name, binding]) => {
      if (!(name in mod)) {
        throw new ReferenceError(
          `Module '${specifier}' has no exported member '${name}'`,
        );
      }
      acc[binding] = mod[name];
      return acc;
    }, modules);
    if (namespaceImport) {
      modules[namespaceImport] = mod;
    }
  }
  return modules;
};

export const stringifyImportDefinition = ({
  specifier,
  all,
  default: exportDefault,
  named = [],
  importBinding = {},
  namespaceImport,
}: Partial<ImportDefinition> & { specifier: string }) => {
  let statement = 'import';
  if (all) {
    statement += ` ${JSON.stringify(specifier)};`;
  } else {
    const defaultBinding = exportDefault && importBinding['default'];
    if (defaultBinding) {
      statement += ` ${defaultBinding}`;
    }
    if (namespaceImport) {
      statement += `${defaultBinding ? ', ' : ''} * as ${namespaceImport}`;
    }
    const importList = named.map((name) =>
      importBinding[name] && name !== importBinding[name]
        ? `${name} as ${importBinding[name]}`
        : name,
    );
    if (importList.length > 0) {
      statement += `${defaultBinding ? ', ' : ''} { ${importList.join(', ')} }`;
    }
    statement += ` from ${JSON.stringify(specifier)};`;
  }
  return statement;
};
