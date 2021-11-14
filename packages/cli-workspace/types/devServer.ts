import {
  FSGetFileMessage,
  FSGetFileHandleMessage,
  FSGetDirectoryHandleMessage,
  FSWriteFileMessage,
} from './fileSystem';
import { MiraMdxFileItem, FileStat } from './workspace';

export type DevServerEvent = {
  type: 'watcher';
  data: {
    event: 'add' | 'unlink' | 'change';
    file: MiraMdxFileItem<number> | FileStat<number>;
  };
};

export type DevServerMessage =
  | FSGetFileMessage
  | FSGetFileHandleMessage
  | FSGetDirectoryHandleMessage
  | FSWriteFileMessage;

export interface DevServerWatcher {
  sendMessage: (message: DevServerMessage) => Promise<void>;
  sendMessageWaitForResponse: <T = unknown>(
    message: DevServerMessage
  ) => Promise<T>;
}
