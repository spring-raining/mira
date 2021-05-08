import * as mdx from '@mdx-js/mdx';
import frontmatter from 'remark-frontmatter';
import type { Plugin, Processor } from 'unified';
import {
  asteroidDiv,
  asteroidCodeBlock,
  insertAsteroidComponent,
} from './remark/asteroid';
import { loadAsteroidConfig } from './remark/loadAsteroidConfig';

export type Options = mdx.Options;
export type { Plugin, Processor };

export {
  parseImportClause,
  parseImportDeclaration,
  importModules,
} from './ecmaImport';
export type { AsteroidConfig, RuntimeScope } from './types';

export const mdxOptions: Options = {
  remarkPlugins: [
    frontmatter,
    loadAsteroidConfig,
    asteroidDiv,
    asteroidCodeBlock,
    insertAsteroidComponent,
  ] as Plugin[],
  rehypePlugins: [],
};

export async function compile(
  input: string,
  options: Options = mdxOptions
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
