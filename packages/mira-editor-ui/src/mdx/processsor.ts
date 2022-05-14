import { nodeTypes, createProcessor } from '@mdx-js/mdx';
import { remarkMarkAndUnravel } from '@mdx-js/mdx/lib/plugin/remark-mark-and-unravel';
// import { remarkMira, rehypeMira, recmaMira } from '@mirajs/mdx-mira';
import {
  MdxJsxAttribute,
  MdxJsxElement,
  MdxFlowExpression,
  MdxTextExpression,
  Parent,
} from '@mirajs/mdx-mira';
import { ElementContent } from 'hast';
import { Handler } from 'mdast-util-to-hast';
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
  const unknownHandler: Handler = (h, node) => {
    if (['mdxJsxTextElement', 'mdxJsxFlowElement'].includes(node.type)) {
      const element = node as MdxJsxElement;
      const props = (element.attributes ?? []).reduce((acc, attr) => {
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
      }, {});
      return h(
        node,
        element.name ?? 'div',
        props,
        (element as Parent).children as ElementContent[],
      );
    }
    if (['mdxTextExpression', 'mdxFlowExpression'].includes(node.type)) {
      // FIXME: Support live evaluation
      const expression = node as MdxFlowExpression | MdxTextExpression;
      return h(node, 'span', [
        { type: 'text', value: `{${expression.value}}` },
      ]);
    }
    return node;
  };

  const pipeline = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkMarkAndUnravel)
    // .use(remarkMira)
    .use(
      // Disable mdxjsEsm node
      () => (ast) => {
        function onVisit(node: Node): void {
          const element = node as MdxJsxElement;
          if (element.data?.estree) {
            element.data.estree = null;
          }
          element.attributes?.forEach(onAttribute);
        }
        function onAttribute(node: Node): void {
          const attribute = node as MdxJsxAttribute;
          onVisit(attribute);
          if (attribute.value && typeof attribute.value === 'object') {
            onVisit(attribute.value);
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
      unknownHandler,
    });
  // .use(rehypeMira);
  return pipeline;
};
