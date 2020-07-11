export interface ImportNode {
  type: 'import';
  value: string;
}

export interface ImportDefinition {
  moduleSpecifier: string;
  importBinding: { [key: string]: string };
  namespaceImport: string | null;
}

// http://www.ecma-international.org/ecma-262/6.0/#sec-imports
const importRe = /^import(?:(.+)from)?\s*('([^']+)'|"([^"]+)")[\s;]*$/;
const namedImportsRe = /^(?:([A-Za-z_$][^\s\{\}]*)\s*,)?\s*\{([^\}]+)\}$/;
const namespaceImportRe = /^(?:([A-Za-z_$][^\s\{\}]*)\s*,)?\s*\*\s+as\s+([A-Za-z_$][^\s\{\}]*)$/;
const defaultBindingRe = /^\s*([A-Za-z_$][^\s\{\}]*)\s*$/;
const importSpecifierRe = /^(?:([A-Za-z_$][^\s\{\}]*)\s+as\s+)?([A-Za-z_$][^\s\{\}]*)$/;

export const parseImportClause = (
  importClause: string
): Pick<ImportDefinition, 'importBinding' | 'namespaceImport'> | null => {
  const importBinding: { [key: string]: string } = {};
  let namespaceImport: string | null = null;

  const trimmed = importClause.trim();
  const namedImportsMatch = trimmed.match(namedImportsRe);
  const namespaceImportMatch = trimmed.match(namespaceImportRe);
  const defaultBindingMatch = trimmed.match(defaultBindingRe);

  if (namedImportsMatch) {
    const defaultImport = namedImportsMatch[1];
    const namedImports = namedImportsMatch[2].split(',');
    if (defaultImport) {
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
    }
  } else if (namespaceImportMatch) {
    const defaultImport = namespaceImportMatch[1];
    if (defaultImport) {
      importBinding.default = defaultImport;
    }
    namespaceImport = namespaceImportMatch[2];
  } else if (defaultBindingMatch) {
    importBinding.default = defaultBindingMatch[1];
  } else {
    return null;
  }
  return { importBinding, namespaceImport };
};

export const parseImportDeclaration = (
  importDeclaration: string
): ImportDefinition | null => {
  const matched = importDeclaration.trim().match(importRe);
  if (!matched) {
    return null;
  }
  const importClause = matched[1];
  const moduleSpecifier = matched[3] || matched[4];

  if (importClause) {
    const bindingDef = parseImportClause(importClause);
    if (!bindingDef) {
      return null;
    }
    return {
      moduleSpecifier,
      ...bindingDef,
    };
  } else {
    return {
      moduleSpecifier,
      importBinding: {},
      namespaceImport: null,
    };
  }
};

export const importModules = async (
  definitions: ImportDefinition[]
): Promise<Record<string, any>> => {
  const loadCache: Record<string, any> = {};
  let modules: Record<string, any> = {};
  for (let definition of definitions) {
    const { moduleSpecifier, importBinding, namespaceImport } = definition;
    if (!(moduleSpecifier in loadCache)) {
      loadCache[moduleSpecifier] = await import(
        /* webpackIgnore: true */ moduleSpecifier
      );
    }
    const mod = loadCache[moduleSpecifier];
    modules = Object.entries(importBinding).reduce<{
      [bind: string]: any;
    }>((acc, [name, binding]) => {
      if (!(name in mod)) {
        throw new ReferenceError(
          `Module '${moduleSpecifier}' has no exported member '${name}'`
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
