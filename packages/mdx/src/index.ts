import yaml from 'js-yaml';
import frontmatter from 'remark-frontmatter';
import { Node } from 'unist';
import visit from 'unist-util-visit';

const loadAsteroidConfig = () =>
  function (this: any, tree: Node) {
    let config = {};
    visit(tree, 'yaml', ({ value }, index, parent) => {
      if (typeof value !== 'string' || index !== 0 || parent !== tree) {
        // not frontmatter
        return;
      }
      try {
        const data = yaml.safeLoad(value);
        if (!data || typeof data !== 'object') {
          return;
        }
        const { asteroid } = data;
        config = asteroid;
      } catch (error) {
        this.file.fail(error.message);
      }
    });
    tree.asteroidConfig = config;
    return tree;
  };

function withAsteroidMdxCompiler(this: any) {
  const { Compiler } = this;
  this.Compiler = function (tree: Node) {
    const jsx = Compiler(tree);
    return jsx;
  };
}

export const mdxOptions = {
  remarkPlugins: [frontmatter, loadAsteroidConfig],
  rehypePlugins: [],
  compilers: [withAsteroidMdxCompiler],
};
