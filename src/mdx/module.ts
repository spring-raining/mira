import { ImportDefinition } from '../contexts/universe';
import { ScriptNote, ASTNode } from '.';

export const collectImports = (scripts: ScriptNote[]): ImportDefinition[] => {
  const imports = scripts
    .reduce<ASTNode[]>((acc, { children }) => [...acc, ...children], [])
    .filter((node) => node.type === 'import');

  // http://www.ecma-international.org/ecma-262/6.0/#sec-imports
  const importRe = /^import(?:(.+)from)?\s*('([^']+)'|"([^"]+)")[\s;]*$/;
  const collection = imports.map<ImportDefinition | undefined>(
    ({ id, value }: { id: string; value: string }) => {
      const matched = value.match(importRe);
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
          id,
          moduleSpecifier,
          importBinding,
          namespaceImport,
        };
      } else {
        return {
          id,
          moduleSpecifier,
          importBinding: {},
          namespaceImport: null,
        };
      }
    }
  );
  return collection.filter((v) => !!v);
};

export const loadModule = async (
  definition: ImportDefinition
): Promise<ImportDefinition> => {
  const { moduleSpecifier, importBinding, namespaceImport } = definition;
  try {
    const mod = await import(/* webpackIgnore: true */ moduleSpecifier);
    const modules = Object.entries(importBinding).reduce<{
      [bind: string]: any;
    }>((acc, [name, binding]) => {
      if (!(name in mod)) {
        throw new Error(
          `Module '${moduleSpecifier}' has no exported member '${name}'`
        );
      }
      acc[binding] = mod[name];
      return acc;
    }, {});
    if (namespaceImport) {
      modules[namespaceImport] = mod;
    }
    return { ...definition, modules };
  } catch (error) {
    return { ...definition, importError: error };
  }
};
