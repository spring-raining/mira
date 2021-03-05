import path from "path";
import { DevServerStartError } from '@web/dev-server';
import { DevServer, Plugin } from '@web/dev-server-core';
import { CliArgs } from './commands';
import { createLogger } from './logger/createLogger';

export async function startAsteroidServer(args: CliArgs) {
  try {
    const plugins: Plugin[] = [];
    const { logger, loggerPlugin } = createLogger({
      debugLogging: false,
      clearTerminalOnReload: false,
      logStartMessage: true,
    });
    plugins.unshift(loggerPlugin);
    const server = new DevServer(
      {
        port: args.port,
        rootDir: path.resolve(__dirname, '../public'),
        hostname: 'localhost',
        basePath: '',
        middleware: [],
        plugins,
        injectWebSocket: true,
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
    if (error instanceof DevServerStartError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}
