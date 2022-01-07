import { MDXProvider, mdx } from '@mdx-js/react';
import { createCompiler } from '@mirajs/core';
import toH from 'hast-to-hyperscript';
import toHast from 'mdast-util-to-hast';
import React, { useState, useEffect } from 'react';
import type { Node } from 'unist';
import visit from 'unist-util-visit';

const components: Record<string, React.ReactNode> = {
  a: (props: React.HTMLAttributes<HTMLElement>) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {props.children}
    </a>
  ),
};

export const MarkdownProvider: React.FC = ({ children }) => (
  <MDXProvider components={components}>{children}</MDXProvider>
);

export const markdownCompiler = createCompiler({
  remarkPlugins: [
    // Disable mdxjsEsm node
    () => (ast) => {
      function onVisit(node: Node): void {
        if (node.data?.estree) {
          node.data.estree = null;
        }
        (node.attributes as Node[])?.forEach(onAttribute);
      }
      function onAttribute(node: Node): void {
        onVisit(node);
        if (node.value) {
          onVisit(node.value as Node);
        }
      }
      visit(ast, ['mdxjsEsm'], onVisit);
    },
  ],
  rehypePlugins: [
    () => (ast) => {
      return toHast(ast, {
        passThrough: [
          'element', // Ignore node already converted to hast
          'mdxjsEsm',
        ],
        unknownHandler: (h, node) => {
          if (['mdxJsxTextElement', 'mdxJsxFlowElement'].includes(node.type)) {
            const props = ((node.attributes ?? []) as Node[]).reduce(
              (acc, attr) => {
                if (attr.type === 'mdxJsxAttribute') {
                  // FIXME: Support live evaluation
                  // if (attr.value?.type === 'mdxJsxAttributeValueExpression') {}
                  if (
                    !attr.value ||
                    typeof attr.value === 'string' ||
                    typeof attr.value === 'number'
                  ) {
                    return { ...acc, [attr.name as string]: attr.value };
                  }
                }
                // FIXME: Support live evaluation
                // if (attr.type === 'mdxJsxExpressionAttribute') {}
                return acc;
              },
              {},
            );
            return h(node, node.name as string, props, node.children as Node[]);
          }
          if (['mdxTextExpression', 'mdxFlowExpression'].includes(node.type)) {
            // FIXME: Support live evaluation
            return h(node, 'span', [
              { type: 'text', value: `{${node.value}}` },
            ]);
          }
          return node;
        },
      });
    },
  ],
});

export const useMarkdownRenderer = (md: string) => {
  const [element, setElement] = useState<React.ReactElement>();

  useEffect(() => {
    (async () => {
      const parsed = markdownCompiler.parse(md);
      const transformed = await markdownCompiler.run(parsed);
      const root = toH(mdx, transformed);
      setElement(root);
    })();
  }, [md]);

  return { element };
};
