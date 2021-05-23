import { parseImportStatement, scanImportSpecifier } from '@asteroid-mdx/core';
import { Brick, ParsedImportStatement } from '../types';

const isPathImport = (spec: string): boolean =>
  spec[0] === '.' || spec[0] === '/';

const isRemoteUrl = (spec: string): boolean =>
  spec.startsWith('//') || /^https?:\/\//.test(spec);

const pathJoin = (...args: string[]): string => {
  let str = args[0];
  for (let i = 1; i < args.length; i++) {
    str = str.replace(/\/$/, '');
    str += args[i].startsWith('/') ? args[i] : `/${args[i]}`;
  }
  return str;
};

const resolveLocalPath = (
  specifier: string,
  basePath: string,
  depsPath: string
): string => {
  const targetUrl = new URL(
    specifier[0] === '/' ? specifier : pathJoin(basePath, specifier),
    window.location.origin
  );
  return pathJoin(depsPath, targetUrl.pathname);
};

export const collectImports = async ({
  brick,
  path,
  depsRootPath,
}: {
  brick: Brick;
  path: string;
  depsRootPath: string;
}): Promise<ParsedImportStatement[]> => {
  if (brick.noteType !== 'script') {
    return [];
  }
  const parseAll =
    brick.children
      ?.filter((node) => node.type === 'mdxjsEsm')
      .map(async (node) => {
        return (await scanImportSpecifier(node.value))
          .map((imp) => {
            const def = parseImportStatement(node.value, imp);
            return def && { ...def, statement: node.value.trim() };
          })
          .filter((_): _ is ParsedImportStatement => !!_);
      }) ?? [];
  const importDefs = await (await Promise.all(parseAll)).flatMap((_) => _);

  const basePath = pathJoin(path.replace(/^\/+/, ''), '../');
  const depsPath = new URL(depsRootPath, window.location.href).pathname;
  const rewrited = importDefs.map((def) => {
    if (isRemoteUrl(def.specifier)) {
      return def;
    }
    if (isPathImport(def.specifier)) {
      return {
        ...def,
        specifier: resolveLocalPath(def.specifier, basePath, depsPath),
      };
    }
    return {
      ...def,
      specifier: pathJoin(depsRootPath, 'resolve', def.specifier),
    };
  });
  return rewrited;
};

export const moduleLoader = async (specifier: string): Promise<any> => {
  return await import(specifier);
};

export const loadModule = async ({
  definition,
  moduleLoader,
}: {
  definition: ParsedImportStatement;
  moduleLoader: (specifier: string) => Promise<any>;
}): Promise<Record<string, any>> => {
  const mod = await moduleLoader(definition.specifier);
  const importValues = Object.entries(definition.importBinding).reduce((acc, [name, binding]) => {
    if (!(name in mod)) {
      throw new ReferenceError(
        `Module '${definition.specifier}' has no exported member '${name}'`
      );
    }
    acc[binding] = mod[name];
    return acc;
  }, {} as Record<string, any>);
  if (definition.namespaceImport) {
    importValues[definition.namespaceImport] = mod;
  }
  return importValues;
};
