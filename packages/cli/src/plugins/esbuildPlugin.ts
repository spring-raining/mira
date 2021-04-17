// Please also refer @web/deb-server-esbuild
// https://github.com/modernweb-dev/web/tree/master/packages/dev-server-esbuild

import path from 'path';
import {
  getRequestFilePath,
  Context,
  Plugin,
  PluginSyntaxError,
  ServerStartParams,
} from '@web/dev-server-core';
import {
  queryAll,
  predicates,
  getTextContent,
  setTextContent,
} from '@web/dev-server-core/dist/dom5';
import { transform, Loader } from 'esbuild';
import { parse as parseHtml, serialize as serializeHtml } from 'parse5';

export interface EsbuildConfig {
  loaders: Record<string, Loader>;
  target: string | string[];
  handledExtensions: string[];
  tsFileExtensions: string[];
  jsxFactory?: string;
  jsxFragment?: string;
  define?: { [key: string]: string };
}

export function esbuildPlugin(): Plugin {
  const loaders = {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.json': 'json',
    '.js': 'js',
  } as const;
  const handledExtensions = Object.keys(loaders);
  const tsFileExtensions: string[] = [];
  for (const [extension, loader] of Object.entries(loaders)) {
    if (loader === 'ts' || loader === 'tsx') {
      tsFileExtensions.push(extension);
    }
  }
  const esbuildConfig: EsbuildConfig = {
    loaders,
    target: 'auto',
    handledExtensions,
    tsFileExtensions,
  };
  let serverStartParams: ServerStartParams;

  const transformCode = async (
    code: string,
    filePath: string,
    loader: Loader,
    target: string | string[]
  ) => {
    try {
      const { code: transformedCode, warnings } = await transform(code, {
        sourcefile: filePath,
        sourcemap: 'inline',
        loader,
        target,
        // don't set any format for JS-like formats, otherwise esbuild reformats the code unnecesarily
        format: ['js', 'jsx', 'ts', 'tsx'].includes(loader) ? undefined : 'esm',
        jsxFactory: esbuildConfig.jsxFactory,
        jsxFragment: esbuildConfig.jsxFragment,
        define: esbuildConfig.define,
      });

      if (warnings) {
        const relativePath = path.relative(process.cwd(), filePath);

        for (const warning of warnings) {
          serverStartParams!.logger.warn(
            `Warning while transforming ${relativePath}: ${warning.text}`
          );
        }
      }
      return transformedCode;
    } catch (e) {
      if (Array.isArray(e.errors)) {
        const msg = e.errors[0];

        if (msg.location) {
          throw new PluginSyntaxError(
            msg.text,
            filePath,
            code,
            msg.location.line,
            msg.location.column
          );
        }
        throw new Error(msg.text);
      }
      throw e;
    }
  };

  const transformHtml = async (
    body: string,
    filePath: string,
    loader: Loader,
    target: string | string[]
  ) => {
    const documentAst = parseHtml(body);
    const inlineScripts = queryAll(
      documentAst,
      predicates.AND(
        predicates.hasTagName('script'),
        predicates.NOT(predicates.hasAttr('src'))
      )
    );
    if (inlineScripts.length === 0) {
      return;
    }
    for (const node of inlineScripts) {
      const code = getTextContent(node);
      const transformedCode = await transformCode(
        code,
        filePath,
        loader,
        target
      );
      setTextContent(node, transformedCode);
    }
    return serializeHtml(documentAst);
  };

  return {
    name: 'esbuild',
    serverStart: (params) => {
      serverStartParams = params;
    },
    resolveImport: async ({ source, context }) => {
      source;
    },
    resolveMimeType: (context) => {
      const fileExtension = path.posix.extname(context.path);
      if (esbuildConfig.handledExtensions.includes(fileExtension)) {
        return 'js';
      }
    },
    // transformCacheKey: () => {},
    transform: async (context) => {
      let loader: Loader;
      if (context.response.is('html')) {
        // we are transforming inline scripts
        loader = 'js';
      } else {
        const fileExtension = path.posix.extname(context.path);
        loader = esbuildConfig.loaders[fileExtension];
      }
      if (!loader) {
        return;
      }
      // TODO: detect build target from user-agent
      const target = 'esnext';
      if (target === 'esnext' && loader === 'js') {
        return;
      }

      const filePath = getRequestFilePath(
        context.url,
        serverStartParams!.config.rootDir
      );
      if (context.response.is('html')) {
        return transformHtml(context.body as string, filePath, loader, target);
      }
      return transformCode(context.body as string, filePath, loader, target);
    },
  };
}
