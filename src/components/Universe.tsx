import React, { useState, useCallback, useEffect } from 'react';
import { createCompiler } from '@mdx-js/mdx';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';
import * as UI from './ui';

export interface Providence {
  asteroidOrder: string[];
  asteroidReturn: { [id: string]: object | null };
}

const createCodeBlock = (code: string) => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(code);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, node) => {
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const blockType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'note';
    if (acc.length === 0) {
      return [
        {
          block: blockType,
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
    if (blockType === 'asteroid' && asteroidMetaMatch) {
      return [
        ...acc,
        {
          block: blockType,
          children: [node],
          id: asteroidMetaMatch[1],
        },
      ];
    } else if (
      tail.block !== blockType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          block: blockType,
          children: [node],
        },
      ];
    } else {
      return [
        ...head,
        {
          block: blockType,
          children: [...tail.children, node],
        },
      ];
    }
  }, []);
  return chunk.map((el) => {
    const { children, block } = el;
    const first = children[0];
    const last = children[children.length - 1];
    return {
      ...el,
      block,
      text:
        block === 'asteroid'
          ? first.value
          : code.slice(first.position.start.offset, last.position.end.offset),
    };
  });
};

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const [codeBlock, setCodeBlock] = useState([]);
  const [providence, setProvidence] = useState<Providence>({
    asteroidOrder: [],
    asteroidReturn: {},
  });

  useEffect(() => {
    const codeBlock = createCodeBlock(code || '');
    setCodeBlock(codeBlock);
    setProvidence({
      asteroidOrder: codeBlock
        .filter(({ block }) => block === 'asteroid')
        .map(({ id }) => id),
      asteroidReturn: {},
    });
  }, [code]);

  return (
    <>
      <UI.Heading>Universe</UI.Heading>
      {codeBlock.map(({ block, text, id }, i) =>
        block === 'note' ? (
          <MarkdownBlock key={i} note={text} />
        ) : block === 'asteroid' ? (
          <CodeBlock
            key={i}
            note={text}
            asteroidId={id}
            providence={providence}
            onProvidenceUpdate={setProvidence}
          />
        ) : (
          <CodeBlock
            key={i}
            note={text}
            providence={providence}
            onProvidenceUpdate={setProvidence}
          />
        )
      )}
    </>
  );
};
