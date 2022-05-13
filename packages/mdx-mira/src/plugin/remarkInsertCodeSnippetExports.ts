import { Plugin } from 'unified';
import { Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { MiraNode } from '../types';

export const remarkInsertCodeSnippetExports: Plugin = () => async (ast) => {
  const parent = ast as Parent;

  visit(parent, 'code', (node: MiraNode, i: number | null, parent: Parent) => {
    if (!node.mira || typeof i !== 'number') {
      return;
    }
    if (node.mira.defaultExportNode) {
      parent.children.splice(i + 1, 0, node.mira.defaultExportNode);
    }
  });
};
