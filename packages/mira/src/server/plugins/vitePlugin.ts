import { createRequire } from 'module';
import type { Framework } from '@mirajs/util';
import { Plugin, Middleware, DevServerCoreConfig } from '@web/dev-server-core';
import { createServer, UserConfig } from 'vite';
import { MIDDLEWARE_PATH_PREFIX } from '../../constants';
import { hmrVitePlugin } from './vite/hmrPlugin';
import { htmlVitePlugin } from './vite/htmlPlugin';

const require = createRequire(import.meta.url);

const VITE_BASE = `${MIDDLEWARE_PATH_PREFIX}-/`;

const iframeDefaultHtml = `<html>
<body style="margin: 0;">
  <mira-eval></mira-eval>
</body>
</html>
`;

export async function vitePluginFactory(
  coreConfig: DevServerCoreConfig,
): Promise<{
  vitePlugin: Plugin;
  viteMiddleware: Middleware;
}> {
  // TODO: Read arbitrary framework
  const { viteConfig: frameworkConfig }: Framework = await import(
    require.resolve('@mirajs/framework-react/viteConfig.js')
  );

  const viteConfig: UserConfig = {
    root: coreConfig.rootDir,
    // base: coreConfig.basePath,
    base: VITE_BASE,
    // set an another cacheDir to separate with user's own Vite project
    cacheDir: 'node_modules/.cache/mira/vite',
    mode: 'development',
    clearScreen: false,
    server: {
      middlewareMode: 'ssr',
      hmr: {
        overlay: false,
      },
    },
    optimizeDeps: frameworkConfig?.optimizeDeps,
    plugins: [
      hmrVitePlugin({
        base: VITE_BASE,
      }),
      htmlVitePlugin(),
    ],
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
      // 1. Use Vite's middleware to serve dependencies
      await new Promise((res) => {
        viteServer.middlewares.handle(ctx.req, ctx.res, res);
      });

      // 2. If not, serve the index HTML file
      const template = await viteServer.transformIndexHtml(
        ctx.path,
        iframeDefaultHtml,
      );
      ctx.body = template;
      ctx.status = 200;
      return;
    }
    await next();
  };

  return { vitePlugin, viteMiddleware };
}
