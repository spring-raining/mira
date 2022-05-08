import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { Extension } from '@codemirror/state';

export const getLanguageExtension = (language: string): Extension => {
  switch (language) {
    case 'markdown':
    case 'md':
      return markdown();
    case 'javascript':
    case 'js':
    case 'mjs':
    case 'cjs':
      return javascript();
    case 'typescirpt':
    case 'ts':
    case 'mts':
    case 'cts':
      return javascript({ typescript: true });
    case 'jsx':
      return javascript({ jsx: true });
    case 'tsx':
      return javascript({ typescript: true, jsx: true });
    default:
      return [];
  }
};
