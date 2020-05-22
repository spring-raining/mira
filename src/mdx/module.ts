import { ImportPart, ImportDefinition } from '../contexts/universe';
import { ScriptNote, ASTNode } from '.';

export const collectImports = (scripts: ScriptNote[]): ImportPart[] => {
  const imports = scripts
    .reduce<ASTNode[]>((acc, { children }) => [...acc, ...children], [])
    .filter((node) => node.type === 'import');

  // http://www.ecma-international.org/ecma-262/6.0/#sec-imports
  const importRe = /^import(?:(.+)from)?\s*('([^']+)'|"([^"]+)")[\s;]*$/;
  const getImportDef = (term: string): ImportDefinition | undefined => {
    const matched = term.trim().match(importRe);
    if (!matched) {
      return;
    }
    const importClause = matched[1];
    const moduleSpecifier = matched[3] || matched[4];

    if (importClause) {
      const importBinding: { [key: string]: string } = {};
      let namespaceImport: string | null = null;

      const namedImportsMatch = importClause.match(
        /(?:([A-Za-z_$][^\s\{\}]*),)?\s*\{([^\}]+)\}/
      );
      const namespaceImportMatch = importClause.match(
        /(?:([A-Za-z_$][^\s\{\}]*),)?\s*\*\s+as\s+([A-Za-z_$][[^\s\{\}]*)/
      );
      const defaultBindingMatch = importClause.match(
        /^\s*([A-Za-z_$][^\s\{\}]*)\s*$/
      );

      if (namedImportsMatch) {
        const defaultImport = namedImportsMatch[1];
        const namedImports = namedImportsMatch[2];
        if (defaultImport) {
          importBinding.default = defaultImport;
        }
        namedImports.split(',').forEach((str, i) => {
          const specifierMatch = str
            .trim()
            .match(
              /^(?:([A-Za-z_$][^\s\{\}]*)\s+as\s+)?([A-Za-z_$][^\s\{\}]*)$/
            );
          if (!specifierMatch) {
            return;
          }
          const identifierName = specifierMatch[1];
          const importedBinding = specifierMatch[2];
          importBinding[identifierName || importedBinding] = importedBinding;
        });
      } else if (namespaceImportMatch) {
        const defaultImport = namespaceImportMatch[1];
        if (defaultImport) {
          importBinding.default = defaultImport;
        }
        namespaceImport = namespaceImportMatch[2];
      } else if (defaultBindingMatch) {
        importBinding.default = defaultBindingMatch[1];
      } else {
        return;
      }
      return {
        moduleSpecifier,
        importBinding,
        namespaceImport,
      };
    } else {
      return {
        moduleSpecifier,
        importBinding: {},
        namespaceImport: null,
      };
    }
  };

  const collection = imports.map<ImportPart>(
    ({ id, value }: { id: string; value: string }) => ({
      id,
      text: value,
      definitions: value
        .split('\n')
        .map(getImportDef)
        .filter((v) => !!v),
    })
  );
  return collection;
};

export const loadModule = async (
  importPart: ImportPart
): Promise<ImportPart> => {
  // const { moduleSpecifier, importBinding, namespaceImport } = definition;
  try {
    const loadCache: Record<string, any> = {};
    let modules = {};
    for (let definition of importPart.definitions) {
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
    return { ...importPart, modules };
  } catch (error) {
    return { ...importPart, importError: error };
  }
};
