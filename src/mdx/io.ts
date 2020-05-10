import { createCompiler } from '@mdx-js/mdx';
import { UniverseContextState, AsteroidBrick } from './../contexts/universe';
import { Note } from '.';

export const importMdx = (text: string): Note[] => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(text);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, node) => {
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const noteType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';
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
      ];
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
      ];
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
      ];
    } else {
      return [
        ...head,
        {
          noteType,
          children: [...tail.children, node],
        },
      ];
    }
  }, []);
  return chunk.map((el) => {
    const { children, noteType } = el;
    const first = children[0];
    const last = children[children.length - 1];
    return {
      ...el,
      noteType,
      text:
        noteType === 'asteroid'
          ? first.value
          : text.slice(first.position.start.offset, last.position.end.offset),
    };
  });
};

const asteroidDiv = (id: string) => `<div><Asteroid_${id} /></div>`;
export const exportMdx = ({ bricks }: UniverseContextState): string => {
  let mdx = '';

  console.log(bricks);
  bricks.forEach((brick, i) => {
    if (brick.noteType === 'markdown') {
      mdx += brick.text + '\n\n';
      return;
    }
    if (brick.noteType === 'asteroid') {
      mdx += `\`\`\`js asteroid=${brick.id}
${brick.text.replace('```', '')}
\`\`\`

${asteroidDiv(brick.id)}

`;
      return;
    }
    if (brick.noteType === 'script') {
      let { text } = brick;
      const prevAsteroidId = i > 0 && (bricks[i - 1] as AsteroidBrick).id;
      if (prevAsteroidId) {
        const re = new RegExp(`^\s*${asteroidDiv(prevAsteroidId)}`);
        text = text.replace(re, '');
      }
      mdx += text ? text + '\n\n' : '\n';
      return;
    }
  });

  return mdx;
};
