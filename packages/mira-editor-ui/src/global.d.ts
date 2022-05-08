declare module 'mdast-util-mdx/to-markdown' {
  const toMarkdown: any;
  export default toMarkdown;
}

declare module '@mirajs/transpiler-esbuild/browser' {
  export * from '@mirajs/transpiler-esbuild';
}

declare type Either<Left, Right> = [null, Right] | [Left, null];
