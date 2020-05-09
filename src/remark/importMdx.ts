import { createCompiler } from '@mdx-js/mdx';

interface ASTNode {
  [field: string]: any;
}

export interface MarkdownNote {
  noteType: 'markdown';
  text: string;
  children: ASTNode[];
}

export interface ScriptNote {
  noteType: 'script';
  text: string;
  children: ASTNode[];
}

export interface AsteroidNote {
  noteType: 'asteroid';
  text: string;
  children: ASTNode[];
  id: string;
}

export type Note = MarkdownNote | ScriptNote | AsteroidNote;

export const importMdx = (text: string): Note[] => {
  const compiler = createCompiler({
    remarkPlugins: [],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(text);
  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, node) => {
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const noteType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';
    if (acc.length === 0) {
      return [
        {
          noteType,
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
    if (noteType === 'asteroid' && asteroidMetaMatch) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
          id: asteroidMetaMatch[1],
        },
      ];
    } else if (
      tail.block !== noteType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
        },
      ];
    } else {
      return [
        ...head,
        {
          noteType,
          children: [...tail.children, node],
        },
      ];
    }
  }, []);
  return chunk.map((el) => {
    const { children, noteType } = el;
    const first = children[0];
    const last = children[children.length - 1];
    return {
      ...el,
      noteType,
      text:
        noteType === 'asteroid'
          ? first.value
          : text.slice(first.position.start.offset, last.position.end.offset),
    };
  });
};
