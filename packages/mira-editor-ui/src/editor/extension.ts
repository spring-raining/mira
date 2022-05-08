import { autocompletion } from '@codemirror/autocomplete';
import { closeBrackets } from '@codemirror/closebrackets';
import { highlightActiveLineGutter } from '@codemirror/gutter';
import { defaultHighlightStyle } from '@codemirror/highlight';
import { history, historyField } from '@codemirror/history';
import { indentOnInput } from '@codemirror/language';
import { bracketMatching } from '@codemirror/matchbrackets';
import {
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/rectangular-selection';
import { Extension, EditorState } from '@codemirror/state';
import {
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  dropCursor,
  EditorView,
} from '@codemirror/view';
import { editorTheme } from './theme';

export const editorExtension: Extension = [
  // lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  // foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  defaultHighlightStyle.fallback,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  // highlightSelectionMatches(),
  EditorView.lineWrapping,
  editorTheme,
];

export const editorStateFieldMap = {
  history: historyField,
};
