import { ASTNode, Brick } from '../types';
import { hydrateMdx } from './io';

export const updateBrickByText = (
  brick: Brick,
  newText: string
): Brick | Brick[] => {
  let mdx = newText;
  if (brick.noteType === 'content' && brick.language !== 'markdown') {
    const node: ASTNode | null = (brick.children ?? [])[0] ?? null;
    const meta: string = brick.asteroid?.isLived
      ? 'asteroid'
      : node?.meta ?? '';
    const textEscaped = newText.replace(/```/g, '');

    mdx = `\`\`\`${brick.language} ${meta}\n${textEscaped}\n\`\`\``;
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
  if (bricks.length > 1) {
    // there's possibility of divide to multiple bricks
    return bricks;
  } else {
    bricks[0].brickId = brick.brickId;
    return bricks[0];
  }
};
