import { nanoid } from 'nanoid/non-secure';
import { Brick, Mira } from '../types';
import { hydrateMdx } from './io';

const liveLanguage = ['javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'];

export const updateBrickByText = (
  brick: Brick,
  newText: string,
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

export const updateBrickTrait = (
  brick: Brick,
  {
    type: newBrickType,
    language: newLanguage,
  }: { type?: Brick['type']; language?: string },
): {
  newBrick: Brick | Brick[];
  syntaxError?: Error | undefined;
} => {
  if (newBrickType && brick.type !== newBrickType) {
    if (newBrickType === 'snippet') {
      const newBrick = {
        ...brick,
        type: newBrickType,
        language: newLanguage ?? ('language' in brick ? brick.language : ''),
      };
      if (liveLanguage.includes(newBrick.language.toLowerCase())) {
        (newBrick as { mira?: Mira }).mira = { id: nanoid(), isLived: true };
      } else {
        delete (newBrick as { mira?: Mira }).mira;
      }
      return updateBrickByText(newBrick, newBrick.text);
    } else {
      const newBrick = {
        ...brick,
        type: newBrickType,
      };
      delete (newBrick as { language?: string }).language;
      delete (newBrick as { mira?: Mira }).mira;
      return updateBrickByText(newBrick, newBrick.text);
    }
  } else if (
    typeof newLanguage === 'string' &&
    brick.type === 'snippet' &&
    brick.language !== newLanguage
  ) {
    const newBrick = {
      ...brick,
      language: newLanguage,
    };
    if (liveLanguage.includes(newBrick.language.toLowerCase())) {
      newBrick.mira = { id: nanoid(), isLived: true };
    } else {
      delete newBrick.mira;
    }
    return updateBrickByText(newBrick, newBrick.text);
  }

  return updateBrickByText(brick, brick.text);
};
