import { Logger, DevServerCoreConfig } from '@web/dev-server-core';
import ip from 'ip';
import chalk from 'chalk';

const createAddress = (config: DevServerCoreConfig, host: string, path: string) =>
  `http${config.http2 ? 's' : ''}://${host}:${config.port}${path}`;

function logNetworkAddress(config: DevServerCoreConfig, logger: Logger, openPath: string) {
  try {
    const address = ip.address();
    if (typeof address === 'string') {
      logger.log(
        `${chalk.white('Network:')}  ${chalk.cyanBright(createAddress(config, address, openPath))}`,
      );
    }
  } catch {
    //
  }
}

export function logStartMessage(config: DevServerCoreConfig, logger: Logger) {
  const prettyHost = config.hostname ?? 'localhost';
  let openPath = config.basePath ?? '/';
  if (!openPath.startsWith('/')) {
    openPath = `/${openPath}`;
  }

  logger.log(chalk.bold('💫 Asteroid server started'));
  logger.log('');

  logger.group();
  logger.log(`${chalk.white('Root dir:')} ${chalk.cyanBright(config.rootDir)}`);
  logger.log(
    `${chalk.white('Local:')}    ${chalk.cyanBright(createAddress(config, prettyHost, openPath))}`,
  );
  logNetworkAddress(config, logger, openPath);
  logger.groupEnd();
  logger.log('');
}
