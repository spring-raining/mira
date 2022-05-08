import { Plugin } from 'vite';
import { IFRAME_CLIENT_IMPORT_PATH } from '../../../constants';

export function htmlVitePlugin(): Plugin {
  return {
    name: 'mira:html',
    apply: 'serve',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: {
            src: IFRAME_CLIENT_IMPORT_PATH,
            type: 'module',
          },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
