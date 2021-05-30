import { WorkspaceRepository } from '@asteroid-mdx/cli-workspace';
import { devServerWatcherUpdateEventName } from './clientCode/devServer';
import { hmrUpdateEventName } from './clientCode/hmr';
import { readProjectFileObject } from './file';
import { ProjectConfig } from './config';
import {
  HMR_PREAMBLE_IMPORT_PATH,
  DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
} from './constants';
import { globFiles } from './util';

export const getWorkspaceRepository = ({
  config,
}: {
  config: ProjectConfig;
}): WorkspaceRepository => {
  return {
    getAsteroidFiles: async () => {
      const { includes, excludes } = config.asteroid.mdx;
      const paths = await globFiles({
        includes,
        excludes,
        cwd: config.asteroid.workspace,
        gitignore: true,
      });
      return (
        await Promise.all(
          paths.map(async (pathname) => {
            const file = await readProjectFileObject({ pathname, config });
            return 'supports' in file && file.supports === 'asteroidMdx'
              ? [file]
              : [];
          })
        )
      ).flat();
    },
    constants: {
      hmrUpdateEventName,
      hmrPreambleImportPath: HMR_PREAMBLE_IMPORT_PATH,
      devServerWatcherUpdateEventName,
      devServerWatcherImportPath: DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
    },
  };
};
