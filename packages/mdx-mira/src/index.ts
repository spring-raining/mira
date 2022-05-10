import { Preset } from 'unified';
import { recmaInsertCodeSnippets } from './plugin/recmaInsertCodeSnippets';
import { remarkCollectCodeSnippets } from './plugin/remarkCollectCodeSnippets';
import { remarkInsertCodeSnippetExports } from './plugin/remarkInsertCodeSnippetExports';
import { remarkTranspileCodeSnippets } from './plugin/remarkTranspileCodeSnippets';

export { codeSnippetsGlobalName, codeSnippetsCommentMarker } from './const';
export { DependencyManager } from './dependency';
export { transpileCode, bundleCode } from './transpiler';
export type { Node, MiraNode } from './types';
export {
  remarkCollectCodeSnippets,
  remarkTranspileCodeSnippets,
  remarkInsertCodeSnippetExports,
  recmaInsertCodeSnippets,
};

const remarkMira: Preset = {
  plugins: [
    remarkCollectCodeSnippets,
    remarkTranspileCodeSnippets,
    remarkInsertCodeSnippetExports,
  ],
};

const rehypeMira: Preset = {
  plugins: [],
};

const recmaMira: Preset = {
  plugins: [recmaInsertCodeSnippets],
};

export { remarkMira, rehypeMira, recmaMira };
