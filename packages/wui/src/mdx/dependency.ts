import { parseImportStatement, scanModuleSpecifier } from '@mirajs/core';
import { Brick, ParsedImportStatement } from '../types';

const getExtname = (path: string): string => {
  const sp = path.split('.');
  return sp.length >= 2 ? `.${sp[sp.length - 1]}` : '';
};

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

const resolveLocalPath = (specifier: string, basePath: string): string => {
  const targetUrl = new URL(
    specifier[0] === '/' ? specifier : pathJoin(basePath, specifier),
    window.location.origin
  );
  return targetUrl.pathname;
};

export const getRelativeSpecifier = ({
  url,
  depsRootPath,
}: {
  url: string;
  depsRootPath: string;
}): string => {
  const assetUrl = new URL(url);
  if (assetUrl.origin !== window.location.origin) {
    return url;
  }
  let targetPath = assetUrl.pathname;
  if (targetPath.startsWith(depsRootPath)) {
    targetPath = targetPath.substring(depsRootPath.length);
  }
  return new URL(targetPath, window.location.origin).pathname;
};

export const collectImports = async ({
  brick,
  path,
}: {
  brick: Brick;
  path: string;
}): Promise<ParsedImportStatement[]> => {
  if (brick.noteType !== 'script') {
    return [];
  }
  const parseAll =
    brick.children
      ?.filter((node) => node.type === 'mdxjsEsm')
      .map(async (node) => {
        return (await scanModuleSpecifier(node.value))[0]
          .map((imp) => {
            const def = parseImportStatement(node.value, imp);
            return def && { ...def, statement: node.value.trim() };
          })
          .filter((_): _ is ParsedImportStatement => !!_);
      }) ?? [];
  const importDefs = await (await Promise.all(parseAll)).flat();

  const rewrited = importDefs.map((def) => rewriteEsmImport(def, { path }));
  return rewrited;
};

export const moduleLoader = async (specifier: string): Promise<any> => {
  return await import(specifier);
};

export const loadModule = async ({
  definition,
  moduleLoader,
  depsRootPath,
}: {
  definition: ParsedImportStatement;
  moduleLoader: (specifier: string) => Promise<any>;
  depsRootPath: string;
}): Promise<Record<string, unknown>> => {
  const actualUrl = isRemoteUrl(definition.specifier)
    ? definition.specifier
    : pathJoin(depsRootPath, definition.specifier);
  const mod = await moduleLoader(actualUrl);
  return mod;
};

export const mapModuleValues = ({
  mod,
  definition,
}: {
  mod: Record<string, unknown>;
  definition: ParsedImportStatement;
}): Record<string, { specifier: string; name: string | null }> => {
  const { specifier } = definition;
  const importValues = Object.entries(definition.importBinding).reduce(
    (acc, [name, binding]) => {
      if (!(name in mod)) {
        throw new ReferenceError(
          `Module '${definition.specifier}' has no exported member '${name}'`
        );
      }
      acc[binding] = { specifier, name };
      return acc;
    },
    {} as Record<string, { specifier: string; name: string | null }>
  );
  if (definition.namespaceImport) {
    importValues[definition.namespaceImport] = { specifier, name: null };
  }
  return importValues;
};

const rewriteEsmImport = (
  def: ParsedImportStatement,
  {
    path,
  }: {
    path: string;
  }
): ParsedImportStatement => {
  if (isRemoteUrl(def.specifier)) {
    return def;
  }
  if (isPathImport(def.specifier)) {
    const basePath = pathJoin(path.replace(/^\/+/, ''), '../');
    let resolvedPath = resolveLocalPath(def.specifier, basePath);

    const importExtname = getExtname(resolvedPath);
    const isProxyImport =
      importExtname && importExtname !== '.js' && importExtname !== '.mjs';
    if (importExtname) {
      if (isProxyImport) {
        resolvedPath = `${resolvedPath}.proxy.js`;
      }
    } else {
      resolvedPath = `${resolvedPath}.js`;
    }
    return {
      ...def,
      specifier: resolvedPath,
    };
  }
  return {
    ...def,
    specifier: pathJoin('/-/resolve', def.specifier),
  };
};
