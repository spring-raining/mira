declare module 'mdast-util-mdx/to-markdown' {
  var toMarkdown: any;
  export default toMarkdown;
}

declare type Either<Left, Right> = [null, Right] | [Left, null];
