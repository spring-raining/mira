import { nodeTypes, createProcessor } from '@mdx-js/mdx';
import { remarkMarkAndUnravel } from '@mdx-js/mdx/lib/plugin/remark-mark-and-unravel';
// import { remarkMira, rehypeMira, recmaMira } from '@mirajs/mdx-mira';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

export const createMdxProcessor = () => {
  const pipeline = createProcessor({
    // remarkPlugins: [remarkMira],
    // rehypePlugins: [rehypeMira],
    // recmaPlugins: [recmaMira],
  });
  return pipeline;
};

export const createCompileToHastProcessor = () => {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMarkAndUnravel)
    // .use(remarkMira)
    .use(
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
        visit(ast, 'mdxjsEsm', onVisit);
      },
    )
    .use(remarkRehype, {
      allowDangerousHtml: true,
      passThrough: [
        'element', // Ignore node already converted to hast
        ...nodeTypes,
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
          return h(node, node.name as string, props, node.children);
        }
        if (['mdxTextExpression', 'mdxFlowExpression'].includes(node.type)) {
          // FIXME: Support live evaluation
          return h(node, 'span', [{ type: 'text', value: `{${node.value}}` }]);
        }
        return node;
      },
    });
  // .use(rehypeMira);
  return pipeline;
};
