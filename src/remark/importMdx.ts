import { createCompiler } from '@mdx-js/mdx';

interface ASTNode {
  [field: string]: any;
}

export interface MarkdownNote {
  block: 'markdown';
  text: string;
  children: ASTNode[];
}

export interface ScriptNote {
  block: 'script';
  text: string;
  children: ASTNode[];
}

export interface AsteroidNote {
  block: 'asteroid';
  text: string;
  id: string;
  children: ASTNode[];
}

export const importMdx = (
  text: string
): (MarkdownNote | ScriptNote | AsteroidNote)[] => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(text);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, node) => {
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const blockType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';
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
          : text.slice(first.position.start.offset, last.position.end.offset),
    };
  });
};
