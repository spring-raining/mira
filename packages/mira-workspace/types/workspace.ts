export interface FileStat<T = Date> {
  path: string;
  size: number;
  mtime: T;
}

export type MiraMdxFileItem<T = Date> = FileStat<T> & {
  supports: 'miraMdx';
  body: string;
};
