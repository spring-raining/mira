import { DevServer, Plugin } from '@web/dev-server-core';
import { CliArgs } from './commands';
import { collectProjectConfig } from './config';
import { createLogger } from './server/logger/createLogger';
import { vendorFileMiddleware } from './server/middlewares/vendorFileMiddleware';
import { vitePluginFactory } from './server/plugins/vitePlugin';
import { watcherPlugin } from './server/plugins/watcherPlugin';
import { webSocketPlugin } from './server/plugins/webSocketPlugin';
import { workspaceServerPluginFactory } from './server/plugins/workspaceServerPlugin';
import { getWorkspaceRepository } from './workspace';

export async function startServer(args: CliArgs) {
  try {
    const config = await collectProjectConfig(args);
    const { vitePlugin, viteMiddleware } = await vitePluginFactory(
      config.server,
    );
    const { workspaceServerPlugin, workspaceServerMiddleware } =
      await workspaceServerPluginFactory({
        config,
        workspaceRepository: getWorkspaceRepository({ config }),
      });
    const plugins: Plugin[] = [
      webSocketPlugin({ config }),
      watcherPlugin({
        config,
      }),
      vitePlugin,
      workspaceServerPlugin,
    ];
    const { logger, loggerPlugin } = createLogger({
      debugLogging: false,
      clearTerminalOnReload: false,
      logStartMessage: true,
    });
    plugins.unshift(loggerPlugin);
    const server = new DevServer(
      {
        ...config.server,
        middleware: [
          vendorFileMiddleware,
          viteMiddleware,
          workspaceServerMiddleware,
        ],
        plugins,
      },
      logger,
    );
    const { webSocketServer } = server.webSockets;
    webSocketServer.listeners('connection').forEach((fn: any) => {
      webSocketServer.off('connection', fn);
    });

    process.on('uncaughtException', (error) => {
      console.error(error);
    });
    process.on('SIGINT', async () => {
      await server.stop();
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    });

    await server.start();
    // openBrowser();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
