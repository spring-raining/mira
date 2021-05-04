import WebSocket from 'ws';
import { Logger, Plugin } from '@web/dev-server-core';

export function asteroidObserverPlugin(): Plugin {
  const onMessage = ({ logger }: { logger: Logger }) => ({
    data,
  }: {
    webSocket: WebSocket;
    data: {
      type: string;
      [key: string]: any;
    };
  }) => {
    if (!data.type.startsWith('ast:')) {
      return;
    }
    logger.log(data);
  };

  return {
    name: 'asteroidObserver',
    injectWebSocket: true,
    serverStart({ webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }
      webSockets.on('message', onMessage({ logger }));
    },
  };
}
