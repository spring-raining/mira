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
