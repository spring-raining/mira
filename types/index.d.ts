declare module '@mdx-js/mdx' {
  export function compile(mdx: string, options?: object): Promise<any>;
  export function sync(mdx: string, options?: object): any;
  export function createMdxAstCompiler(options?: object): any;
  export function createCompiler(options?: object): any;
  export default compile;
}

declare module 'remark-react' {
  declare var remarkReact: any;
  export default remarkReact;
}
