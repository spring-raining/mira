// Remove this after https://github.com/mdx-js/mdx/pull/1514 is released
declare module '@mdx-js/mdx' {
  import {
    mdx,
    sync,
    Options,
    Processor,
    createMdxAstCompiler,
  } from '@mdx-js/mdx';
  export { mdx, sync, Options, Processor, createMdxAstCompiler };
  /**
   * Generated an MDX compiler
   *
   * @param options transform and compiler options
   * @returns Unified Processor for MDX
   */
  export function createCompiler(options?: Options): Processor;
}
