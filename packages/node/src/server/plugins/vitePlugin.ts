import { Plugin, Middleware, DevServerCoreConfig } from '@web/dev-server-core';
import { createServer, UserConfig } from 'vite';
import { MIDDLEWARE_PATH_PREFIX } from '../../constants';
import { hmrVitePlugin } from './vite/hmrPlugin';

const VITE_BASE = `${MIDDLEWARE_PATH_PREFIX}/-/`;

export async function vitePluginFactory(
  coreConfig: DevServerCoreConfig,
): Promise<{
  vitePlugin: Plugin;
  viteMiddleware: Middleware;
}> {
  const viteConfig: UserConfig = {
    root: coreConfig.rootDir,
    // base: coreConfig.basePath,
    base: VITE_BASE,
    // set an another cacheDir to separate with user's own Vite project
    cacheDir: 'node_modules/.cache/mira/vite',
    mode: 'development',
    clearScreen: false,
    server: {
      middlewareMode: 'html',
    },
    plugins: [hmrVitePlugin()],
  };
  const viteServer = await createServer(viteConfig);

  const vitePlugin: Plugin = {
    name: 'vite',
    async serverStop() {
      await viteServer.close();
    },
  };

  const viteMiddleware: Middleware = async (ctx, next) => {
    if (ctx.path.startsWith(VITE_BASE)) {
      ctx.path = ctx.path.substring(VITE_BASE.length - 1);
      await viteServer.middlewares.handle(ctx.req, ctx.res, next);
      ctx.respond = false;
      return;
    }
    await next();
  };

  return { vitePlugin, viteMiddleware };
}
