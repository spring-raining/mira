import { DevServer, Plugin } from '@web/dev-server-core';
import { hmrPlugin } from '@web/dev-server-hmr';
import { CliArgs } from './commands';
import { createLogger } from './server/logger/createLogger';
import { workspaceMiddleware } from './server/middlewares/workspaceMiddleware';
import { asteroidObserverPlugin } from './server/plugins/asteroidObserverPlugin';
import { esbuildPlugin } from './server/plugins/esbuildPlugin';
import { nodeResolvePlugin } from './server/plugins/nodeResolvePlugin';
// import { proactiveWatchPlugin } from './server/plugins/proactiveWatchPlugin';
import { snowpackPluginFactory } from './server/plugins/snowpackPlugin';
import { getWorkspaceRepository } from './workspace';

export async function startAsteroidServer(args: CliArgs) {
  try {
    const coreConfig = {
      port: args.port,
      rootDir: args.rootDir, //path.resolve(__dirname, '../public'),
      hostname: 'localhost',
      basePath: '',
      injectWebSocket: true,
    };
    const { snowpackPlugin, snowpackMiddleware } = snowpackPluginFactory();
    const plugins: Plugin[] = [
      // nodeResolvePlugin(coreConfig.rootDir),
      // esbuildPlugin(),
      // hmrPlugin() as any, // FIXME
      // asteroidObserverPlugin(),
      // proactiveWatchPlugin(),
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
        ...coreConfig,
        middleware: [
          snowpackMiddleware,
          await workspaceMiddleware({
            workspaceRepository: getWorkspaceRepository(args),
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
