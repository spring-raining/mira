import compileMdx, { Options, sync as compileSyncMdx } from "@mdx-js/mdx";
import frontmatter from 'remark-frontmatter';
import type { Plugin } from "unified";
import {
  asteroidDiv,
  asteroidCodeBlock,
  insertAsteroidComponent,
} from './remark/asteroid';
import { loadAsteroidConfig } from './remark/loadAsteroidConfig';

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
  compilers: [],
};

export async function compile(input: string, options: Options = mdxOptions): Promise<string> {
  return await compileMdx(input, options);
}

export function sync(input: string, options: Options = mdxOptions): string {
  return compileSyncMdx(input, options);
}

export default compile;
