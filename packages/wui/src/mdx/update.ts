import { nanoid } from 'nanoid/non-secure';
import { Brick } from '../types';
import { hydrateMdx } from './io';

const liveLanguage = ['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'];

export const updateBrickByText = (
  brick: Brick,
  newText: string
): {
  newBrick: Brick | Brick[];
  syntaxError?: Error | undefined;
} => {
  let mdx = newText;
  if (brick.type === 'snippet') {
    const meta: string = brick.mira?.isLived ? 'mira' : '';
    const textEscaped = newText.replace(/```/g, '');

    mdx = `\`\`\`${brick.language} ${meta}\n${textEscaped}\n\`\`\``;
  }
  let bricks: Brick[] = [brick];
  try {
    bricks = hydrateMdx(mdx);
  } catch (error) {
    if (error instanceof Error) {
      return {
        newBrick: brick,
        syntaxError: error,
      };
    }
  }
  if (bricks.length === 0) {
    // Preserve brick by empty brick
    return {
      newBrick: {
        ...brick,
        text: '',
        children: [],
      },
    };
  }
  if (bricks.length > 1) {
    // there's possibility of divide to multiple bricks
    return { newBrick: bricks };
  } else {
    bricks[0].id = brick.id;
    return { newBrick: bricks[0] };
  }
};

export const updateBrickLanguage = (
  brick: Brick,
  newLanguage: string
): {
  newBrick: Brick | Brick[];
  syntaxError?: Error | undefined;
} => {
  if (brick.type !== 'snippet') {
    return { newBrick: brick };
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
