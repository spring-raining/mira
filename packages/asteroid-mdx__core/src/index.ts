import mdx from "@mdx-js/mdx";
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

export const mdxOptions: mdx.Options = {
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

export async function compile(input: string, options: mdx.Options = mdxOptions): Promise<string> {
  return await mdx(input, options);
}

export function compileSync(input: string, options: mdx.Options = mdxOptions): string {
  return mdx.sync(input, options);
}

export default compile;
