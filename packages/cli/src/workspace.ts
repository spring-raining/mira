import path from 'path';
import { WorkspaceRepository } from '@mirajs/workspace';
import { ProjectConfig } from './config';
import {
  MIDDLEWARE_PATH_PREFIX,
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
    mode: 'devServer',
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
    workspaceDirname: path.basename(config.server.rootDir),
    constants: {
      base: '/',
      depsContext: MIDDLEWARE_PATH_PREFIX,
      frameworkUrl: '/node_modules/@mirajs/react?import',
      hmrUpdateEventName: '__MIRA_HMR_UPDATE__',
      hmrPreambleImportPath: HMR_PREAMBLE_IMPORT_PATH,
      devServerWatcherUpdateEventName: '__MIRA_WDS_UPDATE__',
      devServerWatcherImportPath: DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
    },
  };
};
