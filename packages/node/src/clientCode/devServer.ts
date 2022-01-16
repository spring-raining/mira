export const devServerWatcherNamespace = '__MIRA_WDS__';
export const devServerWatcherUpdateEventName = '__MIRA_WDS_UPDATE__';

// Refers to @web/dev-server-core
// https://github.com/modernweb-dev/web/blob/292c567517d846411f6bcdfd1d60b3f50e20a783/packages/dev-server-core/src/web-sockets/webSocketsPlugin.ts
export const devServerWatcherPreambleCode = `
import { encode, decode, decodeAsync } from '/_mira/vendor/@msgpack/msgpack/dist.es5+esm/index.mjs';

export let webSocket;
export let webSocketOpened;
export let sendMessage;
export let sendMessageWaitForResponse;
let getNextMessageId;
function setupWebSocket() {
  if (
    window.parent !== window &&
    window.parent.${devServerWatcherNamespace} !== undefined
  ) {
    // get the websocket instance from the parent element if present
    const info = window.parent.${devServerWatcherNamespace};
    webSocket = info.webSocket;
    webSocketOpened = info.webSocketOpened;
    getNextMessageId = info.getNextMessageId;
  } else {
    const socketUrl = \`\${location.protocol === 'http:' ? 'ws://' : 'wss://'}\${
      location.host
    }/wds\`;
    webSocket =
      'WebSocket' in window ? new WebSocket(socketUrl) : null;
    webSocketOpened = new Promise((resolve) => {
      if (!webSocket) {
        resolve();
      } else {
        webSocket.addEventListener('open', () => {
          resolve();
        });
      }
    });
    let messageId = 0;
    getNextMessageId = () => {
      if (messageId >= Number.MAX_SAFE_INTEGER) {
        messageId = 0;
      }
      messageId += 1;
      return messageId;
    };
    window.${devServerWatcherNamespace} = {
      webSocket,
      webSocketOpened,
      getNextMessageId,
    };
  }

  sendMessage = async (message) => {
    if (!message.type) {
      throw new Error('Missing message type');
    }
    await webSocketOpened;
    webSocket.send(encode(message));
  };

  // sends a websocket message and expects a response from the server
  sendMessageWaitForResponse = async (message) => {
    return new Promise(async (resolve, reject) => {
      const id = getNextMessageId();

      async function onResponse(e) {
        const message = e.data instanceof Blob
          ? await decodeAsync(e.data.stream())
          : e.data instanceof ArrayBuffer
          ? decode(e.data)
          : typeof e.data === 'string'
          ? JSON.parse(e.data)
          : null;
        if (message && message.type === 'message-response' && message.id === id) {
          webSocket.removeEventListener('message', onResponse);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.response);
          }
        }
      }

      webSocket.addEventListener('message', onResponse);

      setTimeout(() => {
        webSocket.removeEventListener('message', onResponse);
        reject(
          new Error(
            \`Did not receive a server response for message with type \${message.type} within 20000ms\`
          )
        );
      }, 20000);

      sendMessage({ ...message, id });
    });
  };

  if (webSocket) {
    webSocket.addEventListener('message', async (e) => {
      try {
        if (typeof e.data !== 'string') {
          return;
        }
        const msg = JSON.parse(e.data);
        const ev = new CustomEvent('${devServerWatcherUpdateEventName}', {
          detail: msg,
        });
        window.dispatchEvent(ev);
      } catch (error) {
        console.error('[Mira] Error while handling websocket message.');
        console.error(error);
      }
    });
  }
}

setupWebSocket();
`;
