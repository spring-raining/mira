import type { Plugin } from "unified";
import { Node } from 'unist';
import visit from 'unist-util-visit';

const asteroidDivRe = /^<div><Asteroid_(\w+)\s*\/><\/div>$/;
const asteroidMetaRe = /^asteroid=(\w+)$/;

const buildFrameworkDefinition = ({ framework }: { framework: string }) =>
  `import * as $asteroid from '@asteroid-mdx/${framework}'`;

const buildComponentCode = ({
  value,
  asteroidId,
  config,
}: {
  value: string;
  asteroidId: string;
  config: object;
}) => `export const Asteroid_${asteroidId} = $asteroid.component(
  ${JSON.stringify(config)},
  async ({$run}) => {
${value}
  }
)`;

export const asteroidDiv: Plugin = () =>
  function (this: any, tree: Node) {
    // Visit JSX matching asteroidDivRe
    visit(tree, 'jsx', (node) => {
      if (typeof node.value !== 'string') {
        return;
      }
      const match = node.value.match(asteroidDivRe);
      if (match) {
        node.asteroidId = match[1];
      }
    });
    return tree;
  };

export const asteroidCodeBlock: Plugin = () =>
  function (this: any, tree: Node) {
    // Visit fenced code block which has asteroid meta
    visit(tree, 'code', (node) => {
      if (node.lang !== 'jsx' || typeof node.meta !== 'string') {
        return;
      }
      const matched = node.meta
        .split(' ')
        .map((term) => term.trim().match(asteroidMetaRe))
        .find((m) => !!m);
      if (matched) {
        node.asteroidId = matched[1];
      }
    });
    return tree;
  };

export const insertAsteroidComponent: Plugin = () =>
  function (
    this: any,
    tree: Node
  ) {
    const codeBlocks: { asteroidId: string; value: string }[] = [];
    visit(
      tree,
      'code',
      (
        node: Node & {
          value: string;
          asteroidId?: string;
        }
      ) => {
        const { value, asteroidId } = node;
        if (asteroidId) {
          codeBlocks.push({ value, asteroidId });
        }
      }
    );
    // Insert component codes
    const children = [
      ...codeBlocks.map<Node>((codeBlock) => ({
        type: 'export',
        value: buildComponentCode({
          ...codeBlock,
          config: tree.asteroidConfig || {},
        }),
      })),
      ...tree.children as any,
    ];
    // Insert code that loads framework-specific asteroid sdk
    if (tree.asteroidConfig?.framework) {
      children.unshift({
        type: 'import',
        value: buildFrameworkDefinition({framework: tree.asteroidConfig.framework}),
      });
    }
    return {
      ...tree,
      children,
    };
  };
