import { createCompiler } from '@mdx-js/mdx';

export interface ASTNode {
  [field: string]: any;
}

export interface MarkdownNote {
  noteType: 'markdown';
  text: string;
  children: ASTNode[];
}

export interface ScriptNote {
  noteType: 'script';
  text: string;
  children: ASTNode[];
}

export interface AsteroidNote {
  noteType: 'asteroid';
  text: string;
  children: ASTNode[];
  id: string;
}

export type Note = MarkdownNote | ScriptNote | AsteroidNote;

export const importMdx = (text: string): Note[] => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(text);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, node) => {
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const noteType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';
    if (acc.length === 0) {
      return [
        {
          noteType,
          children: [node],
          ...(asteroidMetaMatch
            ? {
                id: asteroidMetaMatch[1],
              }
            : {}),
        },
      ];
    }

    const head = acc.slice(0, acc.length - 1);
    const tail = acc[acc.length - 1];
    if (noteType === 'asteroid' && asteroidMetaMatch) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
          id: asteroidMetaMatch[1],
        },
      ];
    } else if (
      tail.block !== noteType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
        },
      ];
    } else {
      return [
        ...head,
        {
          noteType,
          children: [...tail.children, node],
        },
      ];
    }
  }, []);
  return chunk.map((el) => {
    const { children, noteType } = el;
    const first = children[0];
    const last = children[children.length - 1];
    return {
      ...el,
      noteType,
      text:
        noteType === 'asteroid'
          ? first.value
          : text.slice(first.position.start.offset, last.position.end.offset),
    };
  });
};

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
