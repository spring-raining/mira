import WebSocket from 'ws';
import { Logger, Plugin, Middleware } from '@web/dev-server-core';
import { createConfiguration, startServer, SnowpackDevServer } from 'snowpack';
import { refreshPluginFactory } from './snowpack/refreshPlugin';

const MIDDLEWARE_PREFIX = '/_asteroid';

export function snowpackPluginFactory(): {
  snowpackPlugin: Plugin;
  snowpackMiddleware: Middleware;
} {
  let _snowpack: SnowpackDevServer;

  const snowpackPlugin: Plugin = {
    name: 'snowpack',
    injectWebSocket: true,
    async serverStart({ webSockets, config, server }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      const snowpackConfig = createConfiguration({
        root: config.rootDir,
        mode: 'development',
        mount: {
          [config.rootDir]: {
            url: MIDDLEWARE_PREFIX,
          },
        },
        alias: {},
        plugins: [],
        dependencies: {},
        devOptions: {
          port: 0, // stop starting dev server
          hmr: true,
        },
      });
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
    async serverStop() {
      await _snowpack?.shutdown();
    },
  };

  const snowpackMiddleware: Middleware = async (ctx, next) => {
    if (
      !ctx.url.startsWith(MIDDLEWARE_PREFIX) &&
      !ctx.url.startsWith('/_snowpack')
    ) {
      await next();
      return;
    }
    if (ctx.url.startsWith(`${MIDDLEWARE_PREFIX}/-/resolve/`)) {
      const locator = ctx.url.substring(
        `${MIDDLEWARE_PREFIX}/-/resolve/`.length
      );
      try {
        const nextUrl = await _snowpack.getUrlForPackage(locator);
        const tmpl = `export * from '${nextUrl}';
export {default} from '${nextUrl}';`;
        ctx.body = tmpl;
        ctx.set('Content-Type', 'application/javascript; charset=utf-8');
        return;
      } catch {
        _snowpack.sendResponseError(ctx.req, ctx.res, 404);
      }
      ctx.respond = false;
      return;
    }
    await _snowpack.handleRequest(ctx.req, ctx.res);
    ctx.respond = false;
    return;
  };

  return { snowpackPlugin, snowpackMiddleware };
}
