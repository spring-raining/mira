import { EditorView } from '@codemirror/view';

export const editorTheme = EditorView.baseTheme({
  '&.cm-editor': {
    '&.cm-focused': {
      outline: 'none',
    },
  },
  '.cm-scroller': {
    fontFamily: 'var(--mira-fonts-mono)',
    fontSize: 'var(--mira-fontSizes-xs)',
  },
  '.cm-editor.cm-focused': {
    outline: 'none',
  },
  '.cm-content': {
    padding: '0.75rem 0',
  },
  '.cm-line': {
    padding: '0 0.25rem 0 1rem',
    wordBreak: 'break-all',
  },
});
