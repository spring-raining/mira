import { createCompiler } from '@mdx-js/mdx';
import frontmatter from 'remark-frontmatter';
import yaml from 'js-yaml';
import { nanoid } from 'nanoid';
import type { Parent } from 'unist';
import type { AsteroidConfig } from '@asteroid-mdx/core';
import {
  UniverseContextState,
  AsteroidBrick,
  ScriptBrick,
} from './../contexts/universe';
import { Note, ASTNode } from '.';

const parseConfig = (str: string): [AsteroidConfig | null, object] => {
  try {
    const data = yaml.safeLoad(str);
    if (!data || typeof data !== 'object') {
      return [null, {}];
    }
    const { asteroid, ...otherOption } = data as any;
    return [asteroid || null, otherOption];
  } catch (e) {
    return [null, {}];
  }
};

export const importMdx = (
  mdxString: string
): { note: Note[]; config: AsteroidConfig; frontmatter: object | null } => {
  const compiler = createCompiler({
    remarkPlugins: [frontmatter],
    rehypePlugins: [],
  });
  const parsed = compiler.parse(mdxString) as Parent;
  let config: AsteroidConfig = {
    framework: 'react',
  };
  let otherOption: object | null = null;
  if (
    parsed.children.length > 0 &&
    parsed.children[0].type === 'yaml' &&
    typeof parsed.children[0].value === 'string'
  ) {
    const [asteroidConfig, _otherOption] =
      parseConfig(parsed.children[0].value) || {};
    if (asteroidConfig) {
      config = asteroidConfig;
    }
    otherOption = _otherOption;
  }

  const scriptTypes = ['jsx', 'import', 'export'];
  const asteroidDivRe = /^<div><Asteroid_(\w+)\s*\/><\/div>$/;
  const asteroidMetaRe = /^asteroid=(\w+)$/;
  const chunk = parsed.children.reduce((acc, _node) => {
    // set identical id for each node
    const node: ASTNode = {
      id: nanoid(),
      ..._node,
    };
    const asteroidMetaMatch = node.meta?.match(asteroidMetaRe);
    const noteType = scriptTypes.includes(node.type)
      ? 'script'
      : node.type === 'code' && node.meta && asteroidMetaMatch
      ? 'asteroid'
      : 'markdown';

    // Strip the inserted asteroid components
    if (node.type === 'jsx' && asteroidDivRe.test(node.value)) {
      return acc;
    }
    // Skip config block
    if (node.type === 'yaml') {
      return acc;
    }

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
      ] as Note[];
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
      ] as Note[];
    } else if (
      tail.noteType !== noteType ||
      (node.type === 'heading' && node.depth <= 3)
    ) {
      return [
        ...acc,
        {
          noteType,
          children: [node],
        },
      ] as Note[];
    } else {
      return [
        ...head,
        {
          noteType,
          children: [...tail.children, node],
        },
      ] as Note[];
    }
  }, [] as Note[]);
  const note = chunk.map((el) => {
    const { children, noteType } = el;
    const text =
      noteType === 'asteroid'
        ? children[0].value
        : children
            .map(({ position }) =>
              mdxString.slice(position.start.offset, position.end.offset)
            )
            .join('\n\n');
    return {
      ...el,
      noteType,
      text,
    } as Note;
  });
  return { note, config, frontmatter: otherOption };
};

const asteroidDiv = (id: string) => `<div><Asteroid_${id} /></div>`;
export const exportMdx = ({
  bricks,
  userScript,
  frontmatter,
}: Pick<UniverseContextState, 'bricks' | 'userScript'> & {
  frontmatter: object | null;
}): string => {
  let mdx = '';
  const module = (userScript.children || [])
    .map(({ value }) => value)
    .filter((value): value is string => !!value);
  const config: AsteroidConfig = {
    framework: 'react',
    ...(module.length > 0 && { module }),
  };
  const yamlStr = yaml.safeDump(
    { ...frontmatter, asteroid: config },
    { noCompatMode: true }
  );
  mdx += `---\n${yamlStr}---\n\n`;

  bricks.forEach((brick, i) => {
    if (brick.noteType === 'markdown') {
      mdx += brick.text + '\n\n';
      return;
    }
    if (brick.noteType === 'asteroid') {
      mdx += `\`\`\`jsx asteroid=${brick.id}
${brick.text.replace('```', '')}
\`\`\`

${asteroidDiv(brick.id)}

`;
      return;
    }
    if (brick.noteType === 'script') {
      let { text } = brick;
      mdx += text ? text + '\n\n' : '\n';
      return;
    }
  });

  return mdx;
};
