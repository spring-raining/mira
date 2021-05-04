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
import { Loader } from 'esbuild';
import { esbuildTransform } from './esbuild/transform';

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
      const {code: transformedCode, warnings} = await esbuildTransform({
        config: esbuildConfig,
        code,
        filePath,
        loader,
        target,
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
        return;
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
      return transformCode(context.body as string, filePath, loader, target);
    },
  };
}
