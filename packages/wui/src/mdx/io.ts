import { createCompiler } from '@mirajs/core';
import mdxMarkdownExt from 'mdast-util-mdx/to-markdown';
import toMarkdown from 'mdast-util-to-markdown';
import { nanoid } from 'nanoid/non-secure';
import type { Parent } from 'unist';
import { ASTNode, Brick, NoteBrick, SnippetBrick, ScriptBrick } from '../types';

const scriptTypes = [
  'mdxFlowExpression',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'mdxjsEsm',
];
const omitProperties = ['position', 'data', 'attributes'];
const miraMetaRe = /^mira/;

type NoteChunk = Omit<NoteBrick, 'text'> & { children: ASTNode[] };
type SnippetChunk = Omit<SnippetBrick, 'text'> & { children: ASTNode[] };
type ScriptChunk = Omit<ScriptBrick, 'text'> & { children: ASTNode[] };
type Chunk = NoteChunk | SnippetChunk | ScriptChunk;

export const hydrateMdx = (mdxString: string): Brick[] => {
  const compiler = createCompiler();
  const parsed = compiler.parse(mdxString);

  const chunk = (parsed as Parent).children.reduce((acc, _node): Chunk[] => {
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
          id: nanoid(),
          type: 'script',
          children: [node],
        },
      ];
    } else if (node.type === 'code') {
      const miraMetaMatch = node.meta?.match(miraMetaRe);
      const chunk: SnippetChunk = {
        id: nanoid(),
        type: 'snippet',
        language: node.lang ?? '',
        children: [node],
        ...(miraMetaMatch && {
          mira: {
            id: node.id,
            isLived: true,
          },
        }),
      };
      return [...acc, chunk];
    } else if (
      acc.length === 0 ||
      tail.type !== 'note' ||
      tail.children[0].type === 'code' ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      const chunk: NoteChunk = {
        id: nanoid(),
        type: 'note',
        children: [node],
      };
      return [...acc, chunk];
    } else {
      return [
        ...head,
        {
          ...tail,
          children: [...(tail.children ?? []), node],
        },
      ];
    }
  }, [] as Chunk[]);

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
