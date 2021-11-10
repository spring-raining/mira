import { DevServerMessage } from '@mirajs/cli-workspace';
import { WebSocketsManager } from '@web/dev-server-core';
import { ProjectConfig } from '../../config';
import { getFile, getFileHandle, getDirectoryHandle } from './methods';

export const setupWebSocketHandler = (
  config: ProjectConfig
): Parameters<WebSocketsManager['on']>[1] => async ({ data: d, webSocket }) => {
  const data = d as DevServerMessage;
  if (data.type === 'mira:fs:getFile') {
    const buf = await getFile(data.data, config);
    return webSocket.send(buf, { binary: true });
  }
  if (data.type === 'mira:fs:getFileHandle') {
    const res = await getFileHandle(data.data, config);
    return webSocket.send(JSON.stringify(res));
  }
  if (data.type === 'mira:fs:getDirectoryHandle') {
    const res = await getDirectoryHandle(data.data, config);
    return webSocket.send(JSON.stringify(res));
  }
};
