export interface FileStat<T = Date> {
  path: string;
  size: number;
  mtime: T;
  birthtime: T;
}

export type AsteroidMdxFileItem<T = Date> = FileStat<T> & {
  supports: 'asteroidMdx';
  body: string;
  depsRootPath: string;
};

export type DevServerEvent = {
  type: 'watcher';
  data: {
    event: 'add' | 'unlink' | 'change';
    file: AsteroidMdxFileItem<number> | FileStat<number>;
  };
};
