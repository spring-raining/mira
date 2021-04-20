import path from "path";
import { DevServer, Plugin } from '@web/dev-server-core';
import { hmrPlugin } from "@web/dev-server-hmr";
import { CliArgs } from './commands';
import { createLogger } from './logger/createLogger';
import { asteroidObserverPlugin } from "./plugins/asteroidObserverPlugin";
import { esbuildPlugin } from './plugins/esbuildPlugin';
import { nodeResolvePlugin } from './plugins/nodeResolvePlugin';
import { proactiveWatchPlugin } from "./plugins/proactiveWatchPlugin";

export async function startAsteroidServer(args: CliArgs) {
  try {
    const coreConfig = {
      port: args.port,
      rootDir: path.resolve(__dirname, '../public'),
      hostname: 'localhost',
      basePath: '',
      injectWebSocket: true,
    };
    const plugins: Plugin[] = [
      nodeResolvePlugin(coreConfig.rootDir),
      esbuildPlugin(),
      hmrPlugin() as any, // FIXME
      asteroidObserverPlugin(),
      proactiveWatchPlugin(),
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
        middleware: [],
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
