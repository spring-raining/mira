import { DevServer, Plugin } from '@web/dev-server-core';
import { CliArgs } from './commands';
import { collectProjectConfig } from './config';
import { createLogger } from './server/logger/createLogger';
import { workspaceMiddleware } from './server/middlewares/workspaceMiddleware';
import { snowpackPluginFactory } from './server/plugins/snowpackPlugin';
import { watcherPlugin } from './server/plugins/watcherPlugin';
import { webSocketPlugin } from './server/plugins/webSocketPlugin';
import { getWorkspaceRepository } from './workspace';

export async function startServer(args: CliArgs) {
  try {
    const config = await collectProjectConfig(args);
    const { snowpackPlugin, snowpackConfig } = snowpackPluginFactory(
      config.server,
    );
    const plugins: Plugin[] = [
      webSocketPlugin({ config }),
      watcherPlugin({ config, snowpackConfig }),
      snowpackPlugin,
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
          await workspaceMiddleware({
            workspaceRepository: getWorkspaceRepository({ config }),
          }),
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
    });

    await server.start();
    // openBrowser();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
