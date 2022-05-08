import { DevServerMessage } from '@mirajs/mira-workspace';
import { ProjectConfig } from '../../config';
import {
  getFile,
  getFileHandle,
  getDirectoryHandle,
  writeFile,
} from './methods';

export const setupWebSocketHandler =
  (config: ProjectConfig) => async (data: DevServerMessage) => {
    if (data.type === 'mira:fs:getFile') {
      return await getFile(data.data, config);
    }
    if (data.type === 'mira:fs:getFileHandle') {
      return await getFileHandle(data.data, config);
    }
    if (data.type === 'mira:fs:getDirectoryHandle') {
      return await getDirectoryHandle(data.data, config);
    }
    if (data.type === 'mira:fs:writeFile') {
      return await writeFile(data.data, config);
    }
  };
