import { createCompiler } from '@mdx-js/mdx';
import { nanoid } from 'nanoid';
import type { Parent } from 'unist';
import {
  UniverseContextState,
  AsteroidBrick,
  ScriptBrick,
} from './../contexts/universe';
import { Note, ASTNode } from '.';

export const importMdx = (mdxString: string): Note[] => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed: Parent = compiler.parse(mdxString);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidDivRe = /^<div><Asteroid_(\w+)\s*\/><\/div>$/;
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, _node) => {
    // set identical id for each node
    const node: ASTNode = {
      id: nanoid(),
      ..._node,
    };
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const noteType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';

    // Strip the inserted asteroid components
    if (node.type === 'jsx' && asteroidDivRe.test(node.value)) {
      return acc;
    }

    if (acc.length === 0) {
      return [
        {
          noteType,
          children: [node],
          ...(asteroidMetaMatch
            ? {
                id: asteroidMetaMatch[1],
              }
            : {}),
        },
      ] as Note[];
    }

    const head = acc.slice(0, acc.length - 1);
    const tail = acc[acc.length - 1];
    if (noteType === 'asteroid' && asteroidMetaMatch) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
          id: asteroidMetaMatch[1],
        },
      ] as Note[];
    } else if (
      tail.noteType !== noteType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
        },
      ] as Note[];
    } else {
      return [
        ...head,
        {
          noteType,
          children: [...tail.children, node],
        },
      ] as Note[];
    }
  }, [] as Note[]);
  return chunk.map((el) => {
    const { children, noteType } = el;
    const text =
      noteType === 'asteroid'
        ? children[0].value
        : children
            .map(({ position }) =>
              mdxString.slice(position.start.offset, position.end.offset)
            )
            .join('\n\n');
    return {
      ...el,
      noteType,
      text,
    } as Note;
  });
};

const asteroidDiv = (id: string) => `<div><Asteroid_${id} /></div>`;
export const exportMdx = ({
  bricks,
  userScript,
}: Pick<UniverseContextState, 'bricks' | 'userScript'>): string => {
  let mdx = '';

  const firstScriptBrick: ScriptBrick = {
    ...userScript,
    text: (userScript.children || [])
      .map(({ value }) => (value || '') as string)
      .join('\n\n'),
  };
  [firstScriptBrick, ...bricks].forEach((brick, i) => {
    if (brick.noteType === 'markdown') {
      mdx += brick.text + '\n\n';
      return;
    }
    if (brick.noteType === 'asteroid') {
      mdx += `\`\`\`jsx asteroid=${brick.id}
${brick.text.replace('```', '')}
\`\`\`

${asteroidDiv(brick.id)}

`;
      return;
    }
    if (brick.noteType === 'script') {
      let { text } = brick;
      mdx += text ? text + '\n\n' : '\n';
      return;
    }
  });

  return mdx;
};
