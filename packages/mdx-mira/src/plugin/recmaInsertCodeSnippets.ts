import { Program } from '@mdx-js/mdx/lib/plugin/recma-document';
import { Plugin } from 'unified';
import { Node } from 'unist';
import { codeSnippetsCommentMarker } from '../const';

export const recmaInsertCodeSnippets: Plugin = () => {
  const commentMarkerRe = new RegExp(
    `^${codeSnippetsCommentMarker}\n(.*)$`,
    's',
  );

  return (ast: Node) => {
    const program = ast as unknown as Program;
    const markedComment = (program.comments ?? []).find(
      ({ type, value }) => type === 'Block' && commentMarkerRe.test(value),
    );
    if (!program.comments || !markedComment) {
      return;
    }
    program.comments.splice(program.comments.indexOf(markedComment));
    const codeSnippet = markedComment.value.match(commentMarkerRe)![1];

    const mdxContentIndex =
      program.body.findIndex(
        (node) =>
          node.type === 'FunctionDeclaration' && node.id?.name === 'MDXContent',
      ) ?? 0;
    program.body.splice(mdxContentIndex, 0, {
      type: 'ExportNamedDeclaration',
      // Export as raw literal to avoid parse and re-stringify between ESTree
      declaration: {
        type: 'Literal',
        value: null,
        raw: codeSnippet,
      } as any,
      specifiers: [],
      source: null,
    });
  };
};
