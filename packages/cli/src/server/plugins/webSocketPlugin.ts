import { Plugin } from '@web/dev-server-core';
import { devServerWatcherPreambleCode } from '../../clientCode/devServer';
import { hmrPreambleCode } from '../../clientCode/hmr';
import { ProjectConfig } from '../../config';
import {
  HMR_PREAMBLE_IMPORT_PATH,
  DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
} from '../../constants';
import { setupWebSocketHandler as setupFileSystemHandler } from '../fileSystem/webSocket';

export function webSocketPlugin({ config }: { config: ProjectConfig }): Plugin {
  return {
    name: 'webSocket',
    serverStart({ webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      const fileSystemHandler = setupFileSystemHandler(config);
      webSockets.on('message', fileSystemHandler);
    },
    async serve(ctx) {
      if (ctx.path === HMR_PREAMBLE_IMPORT_PATH) {
        return hmrPreambleCode;
      }
      if (ctx.path === DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH) {
        return devServerWatcherPreambleCode;
      }
    },
  };
}
