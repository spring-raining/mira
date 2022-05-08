declare module 'mdast-util-mdx/to-markdown' {
  const toMarkdown: any;
  export default toMarkdown;
}

declare type Either<Left, Right> = [null, Right] | [Left, null];
