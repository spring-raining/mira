/// <reference types="node" />

declare module '@mdx-js/mdx' {
  import { Processor } from "unified";
  export function compile(mdx: string, options?: object): Promise<string>;
  export function sync(mdx: string, options?: object): string;
  export function createMdxAstCompiler(options?: object): Processor;
  export function createCompiler(options?: object): Processor;
  export default compile;
}

declare module '@mdx-js/mdx/mdx-hast-to-jsx' {
  export function compile(options?: object): void;
  export function toJSX(
    node: any,
    parentNode?: object,
    options?: object
  ): string;
  export default compile;
}

declare module '@mdx-js/util' {
  //export const EMPTY_NEWLINE = EMPTY_NEWLINE
  //export const isImport = isImport
  //export const isExport = isExport
  //export const isExportDefault = isExportDefault
  //export const isImportOrExport = isImportOrExport
  //export const startsWithCapitalLetter = startsWithCapitalLetter
  //export const isComment = isComment
  //export const getCommentContents = getCommentContents
  //export const paramCase = paramCase
  export const toTemplateLiteral: (text: string) => string;
}

declare module '*.mdx' {
  const MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module 'hastscript' {
  import { Node } from 'unist';
  function h(
    selector?: string,
    properties?: object | null,
    ...children: any[]
  ): Node;
  export default h;
}

declare module 'hastscript/svg' {
  import { Node } from 'unist';
  function s(
    selector?: string,
    properties?: object | null,
    ...children: any[]
  ): Node;
  export default s;
}

declare module 'hast-to-hyperscript' {
  import { Node } from 'unist';
  function toH(h: (...args: any[]) => any, node: Node, options?: object): any;
  export default toH;
}

declare module 'hast-util-raw' {
  import { Node } from 'unist';
  function raw(tree: Node, file?: any): any;
  export default raw;
}

declare module 'remark-react' {
  declare var remarkReact: any;
  export default remarkReact;
}

declare module '@isomorphic-git/lightning-fs' {
  import * as fs from 'fs';

  interface CallbackFS {
    new (name?: string, options?: object): LightningFS;
    init(name: string, options?: object): void;
    readFile: typeof fs.readFile;
    writeFile: typeof fs.writeFile;
    unlink: typeof fs.unlink;
    readdir: typeof fs.readdir;
    mkdir: typeof fs.mkdir;
    rmdir: typeof fs.rmdir;
    rename: typeof fs.rename;
    stat: typeof fs.stat;
    lstat: typeof fs.lstat;
    readlink: typeof fs.readlink;
    symlink: typeof fs.symlink;
    backFile(
      filepath: string,
      opts: object,
      cb: (err: Error | null, data?: null) => void
    ): void;
    backFile(
      filePath: string,
      cb: (err: Error | null, data?: null) => void
    ): void;
    du(
      filepath: string,
      opts: object,
      cb: (err: Error | null, data?: number) => void
    ): void;
    du(filepath: string, cb: (err: Error | null, data?: number) => void): void;
  }

  interface PromisifiedFS {
    init(name: string, options?: object): Promise<void>;
    readFile: typeof fs.promises.readFile;
    writeFile: typeof fs.promises.writeFile;
    unlink: typeof fs.promises.unlink;
    readdir: typeof fs.promises.readdir;
    mkdir: typeof fs.promises.mkdir;
    rmdir: typeof fs.promises.rmdir;
    rename: typeof fs.promises.rename;
    stat: typeof fs.promises.stat;
    lstat: typeof fs.promises.lstat;
    readlink: typeof fs.promises.readlink;
    symlink: typeof fs.promises.symlink;
    backFile(filepath: string, opts?: object): Promise<null>;
    du(filepath: string, opts: object): Promise<number>;
  }

  interface LightningFS extends CallbackFS {
    new (name?: string, options?: any): LightningFS;
    promises: PromisifiedFS;
  }

  declare const FS: LightningFS;
  export default FS;
}
