import frontmatter from 'remark-frontmatter';
import { Node } from 'unist';
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

function withAsteroidMdxCompiler(this: any, ret: any) {
  const { Compiler } = this;
  this.Compiler = function (tree: Node) {
    const jsx = Compiler(tree);
    return jsx;
  };
}

export const mdxOptions = {
  remarkPlugins: [
    frontmatter,
    loadAsteroidConfig,
    asteroidDiv,
    asteroidCodeBlock,
    insertAsteroidComponent,
  ],
  rehypePlugins: [],
  compilers: [withAsteroidMdxCompiler],
};
