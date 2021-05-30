import { DevServer, Plugin } from '@web/dev-server-core';
import { hmrPlugin } from '@web/dev-server-hmr';
import { CliArgs } from './commands';
import { collectProjectConfig } from './config';
import { createLogger } from './server/logger/createLogger';
import { workspaceMiddleware } from './server/middlewares/workspaceMiddleware';
import { asteroidWebSocketPlugin } from './server/plugins/asteroidWebSocketPlugin';
import { esbuildPlugin } from './server/plugins/esbuildPlugin';
import { nodeResolvePlugin } from './server/plugins/nodeResolvePlugin';
import { watcherPlugin } from './server/plugins/watcherPlugin';
import { snowpackPluginFactory } from './server/plugins/snowpackPlugin';
import { getWorkspaceRepository } from './workspace';

export async function startAsteroidServer(args: CliArgs) {
  try {
    const config = await collectProjectConfig(args);
    const { snowpackPlugin, snowpackConfig } = snowpackPluginFactory(
      config.server
    );
    const plugins: Plugin[] = [
      // nodeResolvePlugin(coreConfig.rootDir),
      // esbuildPlugin(),
      // hmrPlugin() as any, // FIXME
      asteroidWebSocketPlugin(),
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
      logger
    );

    process.on('uncaughtException', (error) => {
      console.error(error);
    });
    process.on('SIGINT', async () => {
      await server.stop();
      process.exit(0);
    });

    await server.start();
    // openBrowser();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
