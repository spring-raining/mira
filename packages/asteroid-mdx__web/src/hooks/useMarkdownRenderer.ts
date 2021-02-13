import React, { useState, useCallback, useEffect } from 'react';
import { createMdxAstCompiler } from '@mdx-js/mdx';
import { useMDXComponents } from '@mdx-js/react';
import { toJSX } from '@mdx-js/mdx/mdx-hast-to-jsx';
import { toTemplateLiteral } from '@mdx-js/util';
import h from 'hastscript';
import toH from 'hast-to-hyperscript';
import raw from 'hast-util-raw';
import { Node } from 'unist';
import visit from 'unist-util-visit';
import { mdxComponents } from "../mdxComoponents";

const toSlimJSX = (
  node: Node,
  parentNode: object,
  options: { [key: string]: any }
): string => {
  const { preserveNewlines = false } = options;
  if (node.type === 'import' || node.type === 'export' || node.type === 'jsx') {
    return `<p>${toTemplateLiteral(node.value as string)}</p>`;
  } else if (node.type !== 'root') {
    return toJSX(node, parentNode, options);
  }
  const childJSX = ((node.children || []) as any[])
    .map((childNode) => {
      const childOptions = {
        ...options,
        // Tell all children inside <pre> tags to preserve newlines as text nodes
        preserveNewlines: preserveNewlines || node.tagName === 'pre',
      };
      return toSlimJSX(childNode, node, childOptions);
    })
    .join('');
  return `<MDXLayout>${childJSX}</MDXLayout>`;
};

function compileMarkdown(this: any, options = {}) {
  this.Compiler = function (tree: Node) {
    return toSlimJSX(tree, {}, options);
  };
}

const options = {
  remarkPlugins: [],
  rehypePlugins: [],
  compilers: [],
  skipExport: true,
};
export const markdownCompiler = createMdxAstCompiler(options);
// Disable MDX nodes
markdownCompiler.use(() => (ast: Node) => {
  visit(ast, ['jsx', 'import', 'export'], (node) => {
    const { children, tagName, properties } = h('p', null, [node.value]);
    delete node.value;
    node.type = 'element';
    node.children = children;
    node.tagName = tagName;
    node.properties = properties;
  });
});
// Convert raw nodes into HAST
markdownCompiler.use(() => (ast: Node) => {
  visit(ast, 'raw', (node) => {
    const { children, tagName, properties } = raw(node);
    node.type = 'element';
    node.children = children;
    node.tagName = tagName;
    node.properties = properties;
  });
});
markdownCompiler.use(compileMarkdown, options);

export const useMarkdownRenderer = (md: string) => {
  const [element, setElement] = useState<React.ReactElement>();
  const components = useMDXComponents(mdxComponents) || {};

  const createElement = useCallback(
    (name: string, attrs?: object, children?: any[]): React.ReactElement => {
      const Component = (components[name] as React.ComponentType) || name;
      return React.createElement(Component, attrs, children);
    },
    [components]
  );

  useEffect(() => {
    (async () => {
      const parsed = markdownCompiler.parse(md);
      const transformed = await markdownCompiler.run(parsed);
      const root = toH(createElement, transformed);
      setElement(root);
    })();
  }, [md]);

  return { element };
};
