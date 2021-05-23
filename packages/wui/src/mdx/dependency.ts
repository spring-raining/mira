import { parseImportStatement, scanImportSpecifier } from '@asteroid-mdx/core';
import { ImportDefinition } from '@asteroid-mdx/core/lib/ecmaImport';
import { Brick } from '../types';

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
  bricks,
  path,
  depsRootPath,
}: {
  bricks: Brick[];
  path: string;
  depsRootPath: string;
}): Promise<ImportDefinition[]> => {
  const parseAll = bricks.flatMap((brick) => {
    if (brick.noteType !== 'script') {
      return [];
    }
    return (
      brick.children
        ?.filter((node) => node.type === 'mdxjsEsm')
        .map(async (node) => {
          return (await scanImportSpecifier(node.value))
            .map((imp) => parseImportStatement(node.value, imp))
            .filter((_): _ is ImportDefinition => !!_);
        }) ?? []
    );
  });
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

export const loadModule = async (
  definitions: ImportDefinition[],
  moduleLoader: (specifier: string) => Promise<any>
): Promise<Record<string, any>> => {
  const ret = await Promise.all(
    definitions.map(async (definition) => {
      const mod = await moduleLoader(definition.specifier);
      return { ...definition, mod };
    })
  );
  const modules = ret.reduce((acc, definition) => {
    Object.entries(
      definition.importBinding
    ).reduce((acc, [name, binding]) => {
      if (!(name in definition.mod)) {
        throw new ReferenceError(
          `Module '${definition.specifier}' has no exported member '${name}'`
        );
      }
      acc[binding] = definition.mod[name];
      return acc;
    }, acc);
    if (definition.namespaceImport) {
      acc[definition.namespaceImport] = definition.mod;
    }
    return acc;
  }, {} as Record<string, any>);
  return modules;
};
