import { DevServerMessage } from '@mirajs/cli-workspace';
import { encode } from '@msgpack/msgpack';
import { Plugin, WebSocketsManager } from '@web/dev-server-core';
import { devServerWatcherPreambleCode } from '../../clientCode/devServer';
import { hmrPreambleCode } from '../../clientCode/hmr';
import { ProjectConfig } from '../../config';
import {
  HMR_PREAMBLE_IMPORT_PATH,
  DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
} from '../../constants';
import { setupWebSocketHandler as setupFileSystemHandler } from '../fileSystem/webSocket';

const proxyWdsCommunication =
  (
    handler: (data: DevServerMessage) => Promise<any>
  ): Parameters<WebSocketsManager['on']>[1] =>
  async ({ data, webSocket }) => {
    const { id, type } = data;
    let response: unknown;
    let error: unknown;
    if (typeof type !== 'string' || !type.startsWith('mira:')) {
      return;
    }
    try {
      response = await handler(data as DevServerMessage);
    } catch (error) {
      error = error;
    }
    if (typeof id !== 'number') {
      return;
    }
    webSocket.send(
      encode({
        type: 'message-response',
        id,
        ...(response ? { response } : {}),
        ...(error ? { error } : {}),
      }),
      { binary: true }
    );
  };

export function webSocketPlugin({ config }: { config: ProjectConfig }): Plugin {
  return {
    name: 'webSocket',
    serverStart({ webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      const fileSystemHandler = setupFileSystemHandler(config);
      webSockets.on('message', proxyWdsCommunication(fileSystemHandler));
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
