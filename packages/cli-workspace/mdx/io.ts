import { createCompiler } from '@asteroid-mdx/core';
import { ASTNode, Brick, AsteroidBrick } from '@asteroid-mdx/wui';
import { nanoid } from 'nanoid/non-secure';
import type { Node, Parent } from 'unist';

const scriptTypes = [
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'mdxjsEsm',
];
const omitProperties = ['position', 'data', 'attributes'];
const asteroidMetaRe = /^asteroid/;

type Note = Omit<Brick, 'text'> & { children: ASTNode[] };
type AsteroidNote = Omit<AsteroidBrick, 'text'> & { children: ASTNode[] };

export const hydrateMdx = (mdxString: string): Brick[] => {
  const compiler = createCompiler();
  const parsed = compiler.parse(mdxString);
  const scan = (node: ASTNode): ASTNode => {
    const n = { ...node };
    for (let omit of omitProperties) {
      delete n[omit];
    }
    return {
      ...n,
      ...(node.children && { children: node.children.map(scan) }),
    };
  };

  const chunk = (parsed as Parent).children.reduce((acc, _node): Note[] => {
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

    // Skip config block
    if (node.type === 'yaml') {
      return acc;
    }

    if (acc.length === 0) {
      return [
        {
          brickId: nanoid(),
          noteType,
          children: [node],
        },
      ];
    }

    const head = acc.slice(0, acc.length - 1);
    const tail = acc[acc.length - 1];
    if (noteType === 'asteroid') {
      return [
        ...acc,
        {
          brickId: nanoid(),
          noteType,
          asteroid: {
            id: node.id,
          },
          children: [node],
        } as AsteroidNote,
      ];
    } else if (
      tail.noteType !== noteType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          brickId: nanoid(),
          noteType,
          children: [node],
        },
      ];
    } else {
      return [
        ...head,
        {
          ...tail,
          children: [...(tail.children ?? []), node],
        },
      ];
    }
  }, [] as Note[]);
  const brick = chunk.map(
    (el): Brick => {
      const { children, noteType } = el;
      const text: string =
        noteType === 'asteroid'
          ? children[0].value
          : children
              .map(({ position }) =>
                mdxString.slice(position.start.offset, position.end.offset)
              )
              .join('\n\n');
      return { ...el, children: children.map(scan), text } as Brick;
    }
  );

  // Omit properties which cannot serializable
  return JSON.parse(JSON.stringify(brick));
};
