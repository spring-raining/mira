import { parseImportStatement, scanModuleSpecifier } from '@mirajs/core';
import { ParsedImportStatement, ASTNode } from '../types';

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
    window.location.origin,
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

export const resolveImportSpecifier = ({
  specifier,
  path,
}: {
  specifier: string;
  path: string;
}): string => {
  if (isRemoteUrl(specifier)) {
    return specifier;
  }
  if (isPathImport(specifier)) {
    const basePath = pathJoin(path.replace(/^\/+/, ''), '../');
    const resolvedPath = resolveLocalPath(specifier, basePath);
    console.log(specifier, path, basePath, resolvedPath);

    return pathJoin('/-', resolvedPath);
  }
  // set an import query to ensure Vite transforms modules
  return `${pathJoin('/-/node_modules', specifier)}?import`;
};

export const collectEsmImports = async ({
  node,
  path,
}: {
  node: ASTNode[];
  path: string;
}): Promise<ParsedImportStatement[]> => {
  const parseAll = node
    .filter((node) => node.type === 'mdxjsEsm')
    .map(async (node) =>
      (await scanModuleSpecifier(node.value))[0]
        .map((imp) => {
          const def = parseImportStatement(node.value, imp);
          return def && { ...def, statement: node.value.trim() };
        })
        .filter((_): _ is ParsedImportStatement => !!_),
    );
  const importDefs = await (await Promise.all(parseAll)).flat();

  const rewrited = importDefs.map((def) => ({
    ...def,
    specifier: resolveImportSpecifier({ specifier: def.specifier, path }),
  }));
  return rewrited;
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
          `Module '${definition.specifier}' has no exported member '${name}'`,
        );
      }
      acc[binding] = { specifier, name };
      return acc;
    },
    {} as Record<string, { specifier: string; name: string | null }>,
  );
  if (definition.namespaceImport) {
    importValues[definition.namespaceImport] = { specifier, name: null };
  }
  return importValues;
};
