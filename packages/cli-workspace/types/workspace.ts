interface FileStat<T = Date> {
  path: string;
  size: number;
  mtime: T;
  birthtime: T;
}

export type AsteroidFileItem<T = Date> = FileStat<T> & { body: string };
