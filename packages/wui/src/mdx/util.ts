import toMarkdown from 'mdast-util-to-markdown';
import { ASTNode } from '../types';

export const getMarkdownSubject = (node: ASTNode[]): string | null => {
  if (!node[0] || node[0].type !== 'heading' || !(node[0].depth <= 3)) {
    return null;
  }
  return toMarkdown({ type: 'root', children: node[0].children });
};
