import frontmatter from 'remark-frontmatter';
import { Node } from 'unist';
import { asteroidDiv, asteroidCodeBlock } from './remark/asteroid';
import { loadAsteroidConfig } from './remark/loadAsteroidConfig';

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
  ],
  rehypePlugins: [],
  compilers: [withAsteroidMdxCompiler],
};
