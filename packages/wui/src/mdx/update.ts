import { ASTNode, Brick } from '../types';
import { hydrateMdx } from './io';

export const updateBrickByText = (brick: Brick, newText: string): Brick | Brick[] => {
  let mdx = newText;
  if (brick.noteType === 'content' && brick.language !== 'markdown') {
    const node: ASTNode | null = (brick.children ?? [])[0] ?? null;
    const textEscaped = newText.replace(/```/g, '');
    mdx = `\`\`\`${brick.language}${
      node?.meta ? ` ${node.meta}` : ''
    }\n${textEscaped}\n\`\`\``;
  }
  const bricks = hydrateMdx(mdx);
  if (bricks.length === 0) {
    // Preserve brick by empty brick
    return {
      ...brick,
      text: '',
      children: [],
    };
  }
  bricks[0].brickId = brick.brickId;
  // there's possibility of divide to multiple bricks
  return bricks.length > 1 ? bricks : bricks[0];
};
