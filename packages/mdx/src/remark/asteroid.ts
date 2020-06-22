import { Node } from 'unist';
import visit from 'unist-util-visit';

const asteroidDivRe = /^<div><Asteroid_(\w+)\s*\/><\/div>$/;
const asteroidMetaRe = /^asteroid=(\w+)$/;

export const asteroidDiv = () =>
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

export const asteroidCodeBlock = () =>
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
