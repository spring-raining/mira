import { nanoid } from 'nanoid/non-secure';
import { Brick } from '../types';
import { hydrateMdx } from './io';

const liveLanguage = ['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'];

export const updateBrickByText = (
  brick: Brick,
  newText: string
): Brick | Brick[] => {
  let mdx = newText;
  if (brick.type === 'snippet') {
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
    bricks[0].id = brick.id;
    return bricks[0];
  }
};

export const updateBrickLanguage = (
  brick: Brick,
  newLanguage: string
): Brick | Brick[] => {
  if (brick.type !== 'snippet') {
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
