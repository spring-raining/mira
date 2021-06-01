import type { Plugin } from 'unified';
import { Node } from 'unist';
import visit from 'unist-util-visit';

const miraDivRe = /^<div><Mira_(\w+)\s*\/><\/div>$/;
const miraMetaRe = /^mira=(\w+)$/;

const buildFrameworkDefinition = ({ framework }: { framework: string }) =>
  `import * as $mira from '@mirajs/${framework}'`;

const buildComponentCode = ({
  value,
  miraId,
  config,
}: {
  value: string;
  miraId: string;
  config: object;
}) => `export const Mira_${miraId} = $mira.component(
  ${JSON.stringify(config)},
  async ({$run}) => {
${value}
  }
)`;

export const miraDiv: Plugin = () =>
  function (this: any, tree: Node) {
    // Visit JSX matching miraDivRe
    visit(tree, 'jsx', (node) => {
      if (typeof node.value !== 'string') {
        return;
      }
      const match = node.value.match(miraDivRe);
      if (match) {
        node.miraId = match[1];
      }
    });
    return tree;
  };

export const miraCodeBlock: Plugin = () =>
  function (this: any, tree: Node) {
    // Visit fenced code block which has mira meta
    visit(tree, 'code', (node) => {
      if (node.lang !== 'jsx' || typeof node.meta !== 'string') {
        return;
      }
      const matched = node.meta
        .split(' ')
        .map((term) => term.trim().match(miraMetaRe))
        .find((m) => !!m);
      if (matched) {
        node.miraId = matched[1];
      }
    });
    return tree;
  };

export const insertMiraComponent: Plugin = () =>
  function (this: any, tree: Node) {
    const codeBlocks: { miraId: string; value: string }[] = [];
    visit(
      tree,
      'code',
      (
        node: Node & {
          value: string;
          miraId?: string;
        }
      ) => {
        const { value, miraId } = node;
        if (miraId) {
          codeBlocks.push({ value, miraId });
        }
      }
    );
    // Insert component codes
    const children = [
      ...codeBlocks.map<Node>((codeBlock) => ({
        type: 'export',
        value: buildComponentCode({
          ...codeBlock,
          config: (tree as any).miraConfig || {},
        }),
      })),
      ...(tree.children as any),
    ];
    // Insert code that loads framework-specific mira sdk
    if ((tree as any).miraConfig?.framework) {
      children.unshift({
        type: 'import',
        value: buildFrameworkDefinition({
          framework: (tree as any).miraConfig.framework,
        }),
      });
    }
    return {
      ...tree,
      children,
    };
  };
