import { createCompiler } from '@mirajs/core';
import mdxMarkdownExt from 'mdast-util-mdx/to-markdown';
import toMarkdown from 'mdast-util-to-markdown';
import { nanoid } from 'nanoid/non-secure';
import type { Node, Parent } from 'unist';
import { ASTNode, Brick, ContentBrick } from '../types';

const scriptTypes = [
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'mdxjsEsm',
];
const omitProperties = ['position', 'data', 'attributes'];
const miraMetaRe = /^mira/;

type Note = Omit<Brick, 'text'> & { children: ASTNode[] };
type ContentNote = Omit<ContentBrick, 'text'> & { children: ASTNode[] };

export const hydrateMdx = (mdxString: string): Brick[] => {
  const compiler = createCompiler();
  const parsed = compiler.parse(mdxString);

  const chunk = (parsed as Parent).children.reduce((acc, _node): Note[] => {
    // set identical id for each node
    const node: ASTNode = {
      id: nanoid(),
      ..._node,
    };

    // Skip config block
    if (node.type === 'yaml') {
      return acc;
    }

    const head = acc.slice(0, acc.length - 1);
    const tail = acc[acc.length - 1];
    if (scriptTypes.includes(node.type)) {
      return [
        ...acc,
        {
          brickId: nanoid(),
          noteType: 'script',
          children: [node],
        },
      ];
    } else if (node.type === 'code') {
      const miraMetaMatch = node.meta?.match(miraMetaRe);
      const note: ContentNote = {
        brickId: nanoid(),
        noteType: 'content',
        language: node.lang ?? '',
        children: [node],
        ...(miraMetaMatch && {
          mira: {
            id: node.id,
            isLived: true,
          },
        }),
      };
      return [...acc, note];
    } else if (
      acc.length === 0 ||
      tail.noteType !== 'content' ||
      tail.children[0].type === 'code' ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      const note: ContentNote = {
        brickId: nanoid(),
        noteType: 'content',
        language: 'markdown',
        children: [node],
      };
      return [...acc, note];
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
  const bricks = chunk.map(
    (el): Brick => {
      const { children } = el;
      const text: string =
        children[0]?.type === 'code'
          ? children[0].value
          : children
              .map(({ position }) =>
                mdxString.slice(position.start.offset, position.end.offset)
              )
              .join('\n\n');
      return { ...el, children: children.map(scan), text } as Brick;
    }
  );
  return bricks;
};

export const dehydrateBrick = (brick: Brick): string => {
  return toMarkdown(
    { type: 'root', children: brick.children },
    { listItemIndent: 'one', extensions: [mdxMarkdownExt] }
  );
};
