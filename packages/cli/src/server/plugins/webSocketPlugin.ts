import WebSocket from 'ws';
import { Plugin } from '@web/dev-server-core';
import { devServerWatcherPreambleCode } from '../../clientCode/devServer';
import { hmrPreambleCode } from '../../clientCode/hmr';
import {
  HMR_PREAMBLE_IMPORT_PATH,
  DEV_SERVER_WATCHER_PREAMBLE_IMPORT_PATH,
} from '../../constants';

export function webSocketPlugin(): Plugin {
  let _handler: (params: {
    webSocket: WebSocket;
    data: {
      type: string;
      [key: string]: any;
    };
  }) => void;

  return {
    name: 'webSocket',
    serverStart({ webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      _handler = ({ data }) => {
        if (!data.type.startsWith('mira:')) {
          return;
        }
        logger.log(data);
      };
      webSockets.on('message', _handler);
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
