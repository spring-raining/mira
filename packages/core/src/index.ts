import * as mdx from '@mdx-js/mdx';
import frontmatter from 'remark-frontmatter';
import type { Plugin, Processor } from 'unified';
import { miraDiv, miraCodeBlock, insertMiraComponent } from './remark/mira';
// import { loadMiraConfig } from './remark/loadMiraConfig';

export type Options = mdx.Options;
export type { Plugin, Processor };

export {
  parseImportClause,
  parseImportStatement,
  scanModuleSpecifier,
  importModules,
} from './ecmaImport';
export { scanExports } from './declaration-parser';
export type {
  MiraConfig,
  RuntimeScope,
  RuntimeScopeFactory,
  RuntimeEnvironment,
  RuntimeEnvironmentFactory,
} from './types';

export const mdxOptions: Options = {
  remarkPlugins: [
    frontmatter,
    // loadMiraConfig,
    miraDiv,
    miraCodeBlock,
    insertMiraComponent,
  ] as Plugin[],
  rehypePlugins: [],
};

export async function compile(
  input: string,
  options: Options = mdxOptions,
): Promise<string> {
  return await mdx.mdx(input, options);
}

export function sync(input: string, options: Options = mdxOptions): string {
  return mdx.sync(input, options);
}

export function createMdxAstCompiler(options: Options = mdxOptions): Processor {
  return mdx.createMdxAstCompiler(options);
}

export function createCompiler(options: Options = mdxOptions): Processor {
  return mdx.createCompiler(options);
}

export default compile;
