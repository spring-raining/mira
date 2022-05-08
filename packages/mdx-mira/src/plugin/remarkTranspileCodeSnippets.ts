import { scanModuleSpecifier } from '@mirajs/util';
import type { OnLoadResult, Loader } from 'esbuild';
import { Plugin } from 'unified';
import { Parent } from 'unist';
import { visit } from 'unist-util-visit';
import { codeSnippetsCommentMarker, codeSnippetsGlobalName } from '../const';
import { DependencyManager } from '../dependency';
import { stringifyImportDefinition } from '../ecmaScript';
import { bundleCode } from '../transpiler';
import { MiraNode } from '../types';

type Snippets = {
  [name: string]: {
    value: string;
    lang: unknown;
  };
};

const detectLoaderLanguage = (lang: unknown): Loader => {
  switch (lang) {
    case 'javascript':
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'js';
    case 'typescript':
    case 'ts':
    case 'mts':
    case 'cts':
      return 'ts';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    default:
      return 'default';
  }
};

const calcDependency = async (snippets: Snippets) => {
  const dependency = new DependencyManager();
  for (const name in snippets) {
    await dependency.upsertSnippet(name, snippets[name].value);
  }
  const depError = Object.values(dependency._snippetDependencyError).some(
    (e) => !!e,
  );
  if (depError) {
    throw depError;
  }
  return dependency;
};

const getComponentName = (id: string | number) => `Mira_${id}`;

const transpileToExecutableCode = async (
  snippets: Snippets,
  dependency: DependencyManager,
) => {
  const define = [...dependency._definedValues].reduce(
    (acc, val) => ({ ...acc, [val]: val }),
    {} as { [key: string]: string },
  );
  const importDef = Object.keys(snippets).reduce((acc, name) => {
    const exportDef = dependency._snippetExportDef[name] ?? [];
    if (exportDef.length === 0) {
      return acc;
    }
    const path = `#${name}`;
    const def = stringifyImportDefinition({
      specifier: path,
      all: false,
      default: false,
      namespace: false,
      named: [...exportDef],
      importBinding: define,
      namespaceImport: null,
    });
    return { ...acc, [path]: def };
  }, {} as { [path: string]: string });

  const loaderContents: { [path: string]: OnLoadResult } = {};
  for (const [name, { value, lang }] of Object.entries(snippets)) {
    const path = `#${name}`;
    const localImport = Object.entries(importDef)
      .flatMap(([k, v]) => (k !== path ? v : []))
      .join('\n');
    // Strip import declaration
    const [imports] = await scanModuleSpecifier(value);
    const importStripped = imports
      .reduce(
        (acc, imp) =>
          acc.slice(0, imp.ss) +
          '\0'.repeat(imp.se - imp.ss) +
          acc.slice(imp.se),
        value,
      )
      .replace(/\0/g, '');
    loaderContents[path] = {
      contents: `${localImport}\n${importStripped}`,
      loader: detectLoaderLanguage(lang),
    };
  }

  const entryCode = Object.keys(snippets)
    .flatMap((name) => {
      const path = `#${name}`;
      const defaultComponent =
        dependency._snippetHasDefaultExport[name] && getComponentName(name);
      const exportDef = dependency._snippetExportDef[name] ?? [];
      if (!defaultComponent && exports.length === 0) {
        return [];
      }
      const importDef = stringifyImportDefinition({
        specifier: path,
        all: false,
        default: !!defaultComponent,
        namespace: false,
        named: [...exportDef],
        importBinding: {
          ...(defaultComponent && { default: defaultComponent }),
          ...exportDef.reduce((acc, def) => ({ ...acc, [def]: def }), {}),
        },
        namespaceImport: null,
      });
      return `${importDef};\nexport { ${[defaultComponent, ...exportDef]
        .filter((n) => !!n)
        .join(', ')} };`;
    })
    .join('\n');
  const bundleResult = await bundleCode({
    code: entryCode,
    loaderContents,
    globalName: codeSnippetsGlobalName,
  });
  const code = bundleResult.result?.[0].text;
  if (!code || bundleResult.errorObject) {
    throw bundleResult.errorObject;
  }
  return code;
};

const setComponentNameForCodeBlock = (
  parent: Parent,
  dependency: DependencyManager,
) => {
  visit(parent, 'code', (node: MiraNode) => {
    if (!node.mira) {
      return;
    }
    if (dependency._snippetHasDefaultExport[node.mira.id]) {
      const componentName = `${codeSnippetsGlobalName}.${getComponentName(
        node.mira.id,
      )}`;
      node.mira.defaultExportNode = {
        type: 'mdxJsxFlowElement',
        name: componentName,
        attributes: [],
      };
    }
  });
};

/**
 * Transpile code snippets into a single IIFE script and insert to the top of children tree.
 * The transpiled script will be stored as `mdxFlowExpression` with just block comment node
 * and pass through to later process.
 */
export const remarkTranspileCodeSnippets: Plugin = () => async (ast) => {
  const parent = ast as Parent;
  const snippetNode: { [index: number]: MiraNode[] } = {};
  parent.children.forEach((node, i) => {
    if (node.type === 'miraCodeDeclaration') {
      snippetNode[i] = (node as Parent).children.filter(
        (n): n is MiraNode => !!n.mira,
      );
    }
  });

  for (const [i, v] of Object.entries(snippetNode)) {
    const snippets = v.reduce(
      (acc, node) => ({
        ...acc,
        [`${node.mira.id}`]: { value: node.value as string, lang: node.lang },
      }),
      {} as Snippets,
    );
    const dependency = await calcDependency(snippets);
    const text = await transpileToExecutableCode(snippets, dependency);
    setComponentNameForCodeBlock(parent, dependency);
    const insertedComment = `${codeSnippetsCommentMarker}\n${text}`;
    parent.children.splice(+i, 1, {
      type: 'mdxFlowExpression',
      value: `/*${insertedComment}*/`,
      data: {
        estree: {
          type: 'Program',
          body: [],
          comments: [
            {
              type: 'Block',
              value: insertedComment,
            },
          ],
        },
      },
    });
  }
};
