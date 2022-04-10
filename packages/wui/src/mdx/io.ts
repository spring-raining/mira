import { createCompiler } from '@mirajs/core';
import mdxMarkdownExt from 'mdast-util-mdx/to-markdown';
import toMarkdown from 'mdast-util-to-markdown';
import type { Parent, Node } from 'unist';
import { createNewBrick } from '../state/helper';
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

type NoteChunk = Required<Pick<NoteBrick, 'type' | 'ast'>>;
type SnippetChunk = Required<Pick<SnippetBrick, 'type' | 'ast' | 'language'>>;
type ScriptChunk = Required<Pick<ScriptBrick, 'type' | 'ast'>>;
type Chunk = NoteChunk | SnippetChunk | ScriptChunk;

export const parseMdx = (mdxString: string): Node[] => {
  const compiler = createCompiler();
  const parsed = compiler.parse(mdxString) as Parent;
  return parsed.children.filter(
    (node) => node.type !== 'yaml', // Skip config block
  );
};

export const hydrateMdx = (mdxString: string): Brick[] => {
  const compiler = createCompiler();
  const parsed = compiler.parse(mdxString);

  const chunk = (parsed as Parent).children.reduce((acc, _node): Chunk[] => {
    const node: ASTNode = { ..._node };

    const head = acc.slice(0, acc.length - 1);
    const tail = acc[acc.length - 1];
    if (scriptTypes.includes(node.type)) {
      return [
        ...acc,
        {
          type: 'script',
          ast: [node],
        },
      ];
    } else if (node.type === 'code') {
      const chunk: SnippetChunk = {
        type: 'snippet',
        language: node.lang ?? '',
        ast: [node],
      };
      return [...acc, chunk];
    } else if (
      acc.length === 0 ||
      tail.type !== 'note' ||
      tail.ast[0].type === 'code' ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      const chunk: NoteChunk = {
        type: 'note',
        ast: [node],
      };
      return [...acc, chunk];
    } else {
      return [
        ...head,
        {
          ...tail,
          ast: [...(tail.ast ?? []), node],
        },
      ];
    }
  }, [] as Chunk[]);

  const scan = (node: ASTNode): ASTNode => {
    const n = { ...node };
    for (const omit of omitProperties) {
      delete n[omit];
    }
    return {
      ...n,
      ...(node.children && { children: node.children.map(scan) }),
    };
  };
  const bricks = chunk.map((el): Brick => {
    const text: string =
      el.ast[0]?.type === 'code'
        ? el.ast[0].value
        : el.ast
            .map(({ position }) =>
              mdxString.slice(position.start.offset, position.end.offset),
            )
            .join('\n\n');
    const miraMetaMatch =
      el.type === 'snippet' && el.ast[0].meta?.match(miraMetaRe);
    return createNewBrick({
      ...el,
      ast: el.ast.map(scan),
      text,
      isLived: !!miraMetaMatch,
    });
  });
  return bricks;
};

export const dehydrateBrick = (brick: Brick): string => {
  return toMarkdown(
    { type: 'root', children: brick.ast },
    { listItemIndent: 'one', extensions: [mdxMarkdownExt] },
  );
};
