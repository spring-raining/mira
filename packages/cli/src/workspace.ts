import { WorkspaceRepository } from '@mirajs/workspace';
import { devServerWatcherUpdateEventName } from './clientCode/devServer';
import { hmrUpdateEventName } from './clientCode/hmr';
import { ProjectConfig } from './config';
import {
  HMR_PREAMBLE_IMPORT_PATH,
  DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
} from './constants';
import { readProjectFileObject } from './file';
import { globFiles } from './util';

export const getWorkspaceRepository = ({
  config,
}: {
  config: ProjectConfig;
}): WorkspaceRepository => {
  return {
    getMiraFiles: async () => {
      const { includes, excludes } = config.mira.mdx;
      const paths = await globFiles({
        includes,
        excludes,
        cwd: config.mira.workspace,
        gitignore: true,
      });
      return (
        await Promise.all(
          paths.map(async (pathname) => {
            const file = await readProjectFileObject({ pathname, config });
            return 'supports' in file && file.supports === 'miraMdx'
              ? [file]
              : [];
          }),
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
