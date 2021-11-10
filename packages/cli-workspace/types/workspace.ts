export interface FileStat<T = Date> {
  path: string;
  size: number;
  mtime: T;
  birthtime: T;
}

export type MiraMdxFileItem<T = Date> = FileStat<T> & {
  supports: 'miraMdx';
  body: string;
  depsRootPath: string;
};

export type DevServerEvent = {
  type: 'watcher';
  data: {
    event: 'add' | 'unlink' | 'change';
    file: MiraMdxFileItem<number> | FileStat<number>;
  };
};

export type FSFileObject = Uint8Array;

export type FSFileHandlerObject = {
  kind: 'file';
  name: string;
};

export type FSDirectoryHandlerObject = {
  kind: 'directory';
  name: string;
  ls?: (FSFileHandlerObject | FSDirectoryHandlerObject)[];
};

type FSGetFileMessage = {
  type: 'mira:fs:getFile';
  data: {
    path: string[];
  };
};
type FSGetFileHandleMessage = {
  type: 'mira:fs:getFileHandle';
  data: {
    path: string[];
    options?: { create?: boolean };
  };
};
type FSGetDirectoryHandleMessage = {
  type: 'mira:fs:getDirectoryHandle';
  data: {
    path: string[];
    options?: { create?: boolean };
  };
};
export type DevServerMessage =
  | FSGetFileMessage
  | FSGetFileHandleMessage
  | FSGetDirectoryHandleMessage;

export interface DevServerWatcher {
  sendMessage: (message: DevServerMessage) => Promise<void>;
  sendMessageWaitForResponse: <T = unknown>(
    message: DevServerMessage
  ) => Promise<T>;
}
