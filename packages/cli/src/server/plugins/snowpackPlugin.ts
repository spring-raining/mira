import path from 'path';
import { createRequire } from 'module';
import WebSocket from 'ws';
import { Plugin, DevServerCoreConfig } from '@web/dev-server-core';
import {
  createConfiguration,
  startServer,
  SnowpackDevServer,
  SnowpackConfig,
} from 'snowpack';
import { MIDDLEWARE_PATH_PREFIX } from '../../constants';
import { refreshPluginFactory } from './snowpack/refreshPlugin';

const require = createRequire(import.meta.url);

export function snowpackPluginFactory(coreConfig: DevServerCoreConfig): {
  snowpackPlugin: Plugin;
  snowpackConfig: SnowpackConfig;
} {
  let _snowpack: SnowpackDevServer;
  const snowpackConfig = createConfiguration({
    root: coreConfig.rootDir,
    workspaceRoot: coreConfig.rootDir,
    mode: 'development',
    mount: {
      [coreConfig.rootDir]: {
        url: MIDDLEWARE_PATH_PREFIX,
      },
      ...['esbuild-wasm', 'monaco-editor', '@msgpack/msgpack'].reduce(
        (acc, pkg) => ({
          ...acc,
          [path.dirname(require.resolve(`${pkg}/package.json`))]: {
            url: `${MIDDLEWARE_PATH_PREFIX}/-/node_modules/${pkg}`,
            static: true,
            resolve: false,
          },
        }),
        {}
      ),
    },
    alias: {},
    plugins: [],
    dependencies: {},
    devOptions: {
      port: 0, // stop starting dev server
      hmr: true,
    },
  });

  const snowpackPlugin: Plugin = {
    name: 'snowpack',
    injectWebSocket: true,
    async serverStart({ webSockets, server }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      snowpackConfig.plugins.push(refreshPluginFactory(snowpackConfig));
      _snowpack = await startServer(
        { config: snowpackConfig },
        { isDev: true, isWatch: true }
      );
      const { hmrEngine } = _snowpack;
      if (!hmrEngine) {
        throw new Error('HMR is not enabled');
      }
      const orgWss = webSockets.webSocketServer;
      const wss = new WebSocket.Server({ noServer: true, path: '/' });
      wss.on('connection', (client) => {
        hmrEngine.connectClient(client);
        hmrEngine.registerListener(client);
        wss.on('close', () => {
          hmrEngine.disconnectClient(client);
        });
      });
      server.removeAllListeners('upgrade');
      server.on('upgrade', (req, socket, head) => {
        if (req.headers['sec-websocket-protocol'] !== 'esm-hmr') {
          orgWss.handleUpgrade(req, socket, head, (ws) => {
            orgWss.emit('connection', ws, req);
          });
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      });
    },
    async serve(ctx) {
      const handleBySnowpack = async () => {
        await _snowpack.handleRequest(ctx.req, ctx.res);
        ctx.respond = false;
      };

      if (ctx.path.startsWith('/_snowpack')) {
        return await handleBySnowpack();
      }
      if (ctx.path.startsWith(MIDDLEWARE_PATH_PREFIX)) {
        if (
          !ctx.url.startsWith(`${MIDDLEWARE_PATH_PREFIX}/-/`) ||
          ctx.url.startsWith(`${MIDDLEWARE_PATH_PREFIX}/-/node_modules/`)
        ) {
          return await handleBySnowpack();
        }
        if (ctx.path.startsWith(`${MIDDLEWARE_PATH_PREFIX}/-/resolve/`)) {
          const locator = ctx.path.substring(
            `${MIDDLEWARE_PATH_PREFIX}/-/resolve/`.length
          );
          try {
            const nextUrl = await _snowpack.getUrlForPackage(locator);
            const tmpl = `export * from '${nextUrl}';
export {default} from '${nextUrl}';`;
            return {
              body: tmpl,
              type: '.js',
            };
          } catch {
            _snowpack.sendResponseError(ctx.req, ctx.res, 404);
            ctx.respond = false;
            return;
          }
        }
      }
    },
    async serverStop() {
      await _snowpack?.shutdown();
    },
  };

  return { snowpackPlugin, snowpackConfig };
}
