export type FSFileObject = {
  buf: Uint8Array;
};

export type FSFileHandlerObject = {
  kind: 'file';
  name: string;
};

export type FSDirectoryHandlerObject = {
  kind: 'directory';
  name: string;
  ls?: (FSFileHandlerObject | FSDirectoryHandlerObject)[];
};

export type FSGetFileMessage = {
  type: 'mira:fs:getFile';
  data: {
    path: string[];
  };
};

export type FSGetFileHandleMessage = {
  type: 'mira:fs:getFileHandle';
  data: {
    path: string[];
    options?: { create?: boolean };
  };
};

export type FSGetDirectoryHandleMessage = {
  type: 'mira:fs:getDirectoryHandle';
  data: {
    path: string[];
    options?: { create?: boolean };
  };
};

export type FSWriteFileMessage = {
  type: 'mira:fs:writeFile';
  data: {
    path: string[];
    data: Uint8Array | string;
  };
};
