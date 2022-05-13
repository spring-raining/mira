import type { Code } from 'mdast';
import type { Literal, Node, Parent } from 'unist';

export type { Code, Literal, Node, Parent };

export type MdxJsxExpressionAttribute = Literal & {
  type: 'mdxJsxExpressionAttribute';
};

export type MdxJsxAttributeValueExpression = Literal & {
  type: 'mdxJsxAttributeValueExpression';
};

export type MdxJsxAttribute = Node & {
  type: 'mdxJsxAttribute';
  name: string;
  value?: MdxJsxAttributeValueExpression | string;
};

export type MdxJsxElement = Node & {
  name?: string;
  attributes?: (MdxJsxExpressionAttribute | MdxJsxAttribute)[];
};

export type MdxJsxFlowElement = Node &
  MdxJsxElement & {
    type: 'mdxJsxFlowElement';
  };

export type MdxJsxTextElement = Node &
  MdxJsxElement & {
    type: 'mdxJsxTextElement';
  };

export type MdxFlowExpression = Literal & {
  type: 'mdxFlowExpression';
};

export type MdxTextExpression = Literal & {
  type: 'mdxTextExpression';
};

export type MdxJsEsm = Literal & {
  type: 'mdxjsEsm';
};

export type MiraNode = Code & {
  mira: {
    id: string | number;
    metaString?: string;
    defaultExportNode?: MdxJsxFlowElement;
  };
};
