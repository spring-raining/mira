import { DevServerCoreConfig } from '@web/dev-server-core';
import { CliArgs } from './commands';

export interface ProjectConfig {
  server: DevServerCoreConfig;
  mira: {
    workspace: string;
    mdx: {
      includes: string[];
      excludes: string[];
    };
  };
}

export const collectProjectConfig = async (
  cliArgs: CliArgs,
): Promise<ProjectConfig> => {
  return {
    server: {
      port: cliArgs.port,
      rootDir: cliArgs.rootDir,
      hostname: 'localhost',
      basePath: '',
      injectWebSocket: true,
    },
    mira: {
      workspace: cliArgs.rootDir,
      mdx: {
        includes: ['**/*.mdx'],
        excludes: [],
      },
    },
  };
};
