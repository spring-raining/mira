import { EditorView } from '@codemirror/view';

export const fontFamily = 'var(--mira-fonts-mono)';
export const fontSize = 'var(--mira-fontSizes-xs)';
export const lineHeight = '1.5';
export const contentPadding = '0.75rem 0';
export const linePadding = '0 1rem';

export const editorTheme = EditorView.baseTheme({
  '&.cm-editor': {
    '&.cm-focused': {
      outline: 'none',
    },
  },
  '.cm-scroller': {
    fontFamily,
    fontSize,
    lineHeight,
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  },
  '.cm-content': {
    padding: contentPadding,
  },
  '.cm-line': {
    padding: linePadding,
    wordBreak: 'break-all',
  },
});
