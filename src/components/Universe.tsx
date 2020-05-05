import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import mdx, { createCompiler } from '@mdx-js/mdx';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';

const createCodeBlock = (code: string) => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(code);
  const scriptTypes = ['jsx', 'import', 'export'];
  const chunk = parsed.children.reduce(
    (acc, node) => {
      const head = acc.slice(0, acc.length - 1);
      const tail = acc[acc.length - 1];
      const last = tail.length > 0 && tail[tail.length - 1];

      if (!last) {
        return [...head, [node]];
      }
      if (scriptTypes.includes(node.type)) {
        return scriptTypes.includes(last.type)
          ? [...head, [...tail, node]]
          : [...acc, [node]];
      } else if (node.type === 'heading' && node.depth <= 3) {
        return [...acc, [node]];
      } else {
        return scriptTypes.includes(last.type)
          ? [...acc, [node]]
          : [...head, [...tail, node]];
      }
    },
    [[]]
  );
  return chunk
    .filter((c) => c.length > 0)
    .map((c) => {
      const first = c[0];
      const last = c[c.length - 1];
      return {
        block: scriptTypes.includes(c[0].type) ? 'script' : 'note',
        text: code.slice(first.position.start.offset, last.position.end.offset),
      };
    });
};

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const codeBlock = createCodeBlock(code);
  return (
    <>
      <h1>Input</h1>
      <pre>{code}</pre>
      <h1>Output</h1>
      {codeBlock.map(({ block, text }, i) =>
        block === 'script' ? (
          <CodeBlock key={i} note={text} />
        ) : (
          <MarkdownBlock key={i} note={text} />
        )
      )}
    </>
  );
};
