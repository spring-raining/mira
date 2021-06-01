import yaml from 'js-yaml';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import visit from 'unist-util-visit';

export const loadMiraConfig: Plugin = () =>
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
        const { mira } = data as any;
        config = mira;
      } catch (error) {
        this.file.fail(error.message);
      }
    });
    tree.miraConfig = config;
    return tree;
  };
