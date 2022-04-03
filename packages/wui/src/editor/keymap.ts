import { completionKeymap } from '@codemirror/autocomplete';
import { closeBracketsKeymap } from '@codemirror/closebrackets';
import { standardKeymap } from '@codemirror/commands';
import { commentKeymap } from '@codemirror/comment';

export const editorKeymap = [
  ...closeBracketsKeymap,
  ...standardKeymap,
  // ...searchKeymap,
  // ...historyKeymap,
  // ...foldKeymap,
  ...commentKeymap,
  ...completionKeymap,
  // ...lintKeymap,
];
