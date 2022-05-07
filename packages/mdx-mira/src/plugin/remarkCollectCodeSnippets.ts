import { Plugin } from 'unified';
import { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { MiraNode } from '../types';

export const remarkCollectCodeSnippets: Plugin = () => (ast) => {
  const parent = ast as Parent;
  const codeBlocks: Node[] = [];

  let index = 0;
  visit(ast, 'code', (node: Node) => {
    if (typeof node.meta !== 'string') {
      return;
    }
    const metaList = node.meta.split(/\s+/g).filter((term) => !!term);
    const matchedIndex = metaList.findIndex((term) => term === 'mira');

    if (matchedIndex < 0) {
      return;
    }
    const metaString =
      (matchedIndex < metaList.length - 1 && metaList[matchedIndex + 1]) ||
      'TODO';

    const miraNode = node as MiraNode;
    miraNode.mira = {
      ...miraNode.mira,
      id: ++index,
      metaString,
    };
    codeBlocks.push(node);
  });

  if (codeBlocks.length === 0) {
    return;
  }
  parent.children?.unshift({
    type: 'miraCodeDeclaration',
    children: codeBlocks,
  });
};
