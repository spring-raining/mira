import {
  parseImportStatement,
  scanModuleSpecifier,
  ImportDefinition,
} from '@mirajs/util';
import { ParsedImportStatement, ASTNode } from '../types';

const isPathImport = (spec: string): boolean =>
  spec[0] === '.' || spec[0] === '/';

const isRemoteUrl = (spec: string): boolean => /^https?:\/\//.test(spec);

export const pathJoin = (...args: string[]): string => {
  let str = args[0];
  for (let i = 1; i < args.length; i++) {
    str = str.replace(/\/$/, '');
    str += args[i].startsWith('/') ? args[i] : `/${args[i]}`;
  }
  return str;
};

export const resolveLocalPath = (
  specifier: string,
  basePath: string,
): string => {
  const targetUrl = new URL(
    specifier[0] === '/' ? specifier : pathJoin(basePath, specifier),
    window.location.origin,
  );
  return targetUrl.pathname;
};

export const resolveImportSpecifier = ({
  specifier,
  base,
  depsContext,
  importerContext = '.',
}: {
  specifier: string;
  base: string;
  depsContext: string;
  importerContext?: string;
}): string => {
  const origin = window.location.origin;
  if (isRemoteUrl(specifier)) {
    return specifier;
  }
  if (isPathImport(specifier)) {
    const basePath = pathJoin(importerContext.replace(/^\/+/, ''), '../');
    const resolvedPath = resolveLocalPath(specifier, basePath);
    // import query represents that is imported directly, which affects HMR behavior
    return `${pathJoin(origin, base, depsContext, '/-', resolvedPath)}?import`;
  }
  return `${pathJoin(
    origin,
    base,
    depsContext,
    '/-/node_modules',
    specifier,
  )}?import`;
};

export const collectEsmImports = async ({
  node,
  base,
  depsContext,
  importerContext,
}: {
  node: ASTNode[];
  base: string;
  depsContext: string;
  importerContext: string;
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
    specifier: resolveImportSpecifier({
      specifier: def.specifier,
      base,
      depsContext,
      importerContext,
    }),
  }));
  return rewrited;
};

export const loadModule = async <T = Record<string, unknown>>({
  specifier,
  moduleLoader,
}: {
  specifier: string;
  moduleLoader: (specifier: string) => Promise<any>;
}): Promise<T> => {
  const mod = await moduleLoader(specifier);
  return mod;
};

export const mapModuleValues = ({
  moduleProperties,
  definition,
}: {
  moduleProperties: Set<string>;
  definition: ImportDefinition;
}): Record<string, { specifier: string; name: string | null }> => {
  const { specifier } = definition;
  const importValues = Object.entries(definition.importBinding).reduce(
    (acc, [name, binding]) => {
      if (!moduleProperties.has(name)) {
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
