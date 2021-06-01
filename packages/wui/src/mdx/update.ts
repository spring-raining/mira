import { nanoid } from 'nanoid/non-secure';
import { ASTNode, Brick } from '../types';
import { hydrateMdx } from './io';

const liveLanguage = ['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'];
const markdownLanguage = ['md', 'mkd', 'markdn', 'markdown'];

export const updateBrickByText = (
  brick: Brick,
  newText: string
): Brick | Brick[] => {
  let mdx = newText;
  if (
    brick.noteType === 'content' &&
    !markdownLanguage.includes(brick.language.toLowerCase())
  ) {
    const meta: string = brick.mira?.isLived ? 'mira' : '';
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

export const updateBrickLanguage = (
  brick: Brick,
  newLanguage: string
): Brick | Brick[] => {
  if (brick.noteType !== 'content') {
    return brick;
  }
  const newBrick = { ...brick };
  if (liveLanguage.includes(newLanguage.toLowerCase())) {
    newBrick.mira = { id: nanoid(), isLived: true };
  } else {
    delete newBrick.mira;
  }
  newBrick.language = newLanguage;
  return updateBrickByText(newBrick, newBrick.text);
};
