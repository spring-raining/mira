import { ScriptNote, ASTNode } from '.';

export const collectImports = async (
  scripts: ScriptNote[]
): Promise<{ [name: string]: any }> => {
  const imports = scripts
    .reduce<ASTNode[]>((acc, { children }) => [...acc, ...children], [])
    .filter((node) => node.type === 'import');

  // http://www.ecma-international.org/ecma-262/6.0/#sec-imports
  const importRe = /^import(?:(.+)from)?\s*('([^']+)'|"([^"]+)")[\s;]*$/;
  const collection = await Promise.all(
    imports.map<{ [name: string]: any }>(
      async ({ value }: { value: string }) => {
        const matched = value.match(importRe);
        if (!matched) {
          return {};
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
              importBinding[
                identifierName || importedBinding
              ] = importedBinding;
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
            return {};
          }

          const mod = await import(/* webpackIgnore: true */ moduleSpecifier);
          const bind = Object.entries(importBinding).reduce<{
            [bind: string]: any;
          }>((acc, [name, binding]) => {
            acc[binding] = mod[name];
            return acc;
          }, {});
          if (namespaceImport) {
            bind[namespaceImport] = mod;
          }
          return bind;
        } else {
          await import(/* webpackIgnore: true */ moduleSpecifier);
          return {};
        }
      }
    )
  );

  return collection.reduce((acc, obj) => ({ ...acc, ...obj }), {});
};
