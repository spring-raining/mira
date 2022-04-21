import { DevServerMessage } from '@mirajs/workspace';
import { encode, decode } from '@msgpack/msgpack';
import {
  Plugin,
  WebSocketsManager,
  WebSocket,
  Logger,
} from '@web/dev-server-core';
import { ProjectConfig } from '../../config';
import { setupWebSocketHandler as setupFileSystemHandler } from '../fileSystem/webSocket';

const proxyWdsCommunication =
  ({ logger }: { logger: Logger }) =>
  (
    handler: (data: DevServerMessage) => Promise<any>,
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
    } catch (err) {
      logger.error(err);
      error = err;
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
      { binary: true },
    );
  };

const overrideWebSocketsHandler = (webSockets: WebSocketsManager) => {
  // Remove existing listener
  const { webSocketServer } = webSockets;
  webSocketServer.listeners('connection').forEach((fn: any) => {
    webSocketServer.off('connection', fn);
  });

  const openSockets = new Set<WebSocket>();
  webSocketServer.on('connection', (webSocket, req) => {
    openSockets.add(webSocket);
    webSocket.on('close', () => {
      openSockets.delete(webSocket);
    });

    webSocket.on('message', (rawData) => {
      try {
        const data =
          rawData instanceof Buffer || rawData instanceof ArrayBuffer
            ? decode(rawData)
            : typeof rawData === 'string'
            ? JSON.parse(rawData)
            : null;
        if (!data.type) {
          throw new Error('Missing property "type".');
        }
        webSockets.emit('message', { webSocket, data });
      } catch (error) {
        console.error(
          'Failed to parse websocket event received from the browser',
        );
        console.error(error);
      }
    });
  });

  webSockets.send = (message: string) => {
    openSockets.forEach((socket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(message);
      }
    });
  };
};

export function webSocketPlugin({ config }: { config: ProjectConfig }): Plugin {
  return {
    name: 'webSocket',
    serverStart({ webSockets, logger }) {
      if (!webSockets) {
        throw new Error('webSockets is not enabled');
      }

      overrideWebSocketsHandler(webSockets);
      const fileSystemHandler = setupFileSystemHandler(config);
      webSockets.on(
        'message',
        proxyWdsCommunication({ logger })(fileSystemHandler),
      );
    },
  };
}
