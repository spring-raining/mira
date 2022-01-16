import { ModuleNode, Plugin } from 'vite';

const availableExtensionRe = /\.m?(t|j)sx?$/;
const importMetaHotRe = /import\s*\.\s*meta\s*\.\s*hot/g;

export function hmrVitePlugin(): Plugin {
  return {
    name: 'mira:hmr',
    apply: 'serve',
    async handleHotUpdate({ server, modules }) {
      const importers = new Set<ModuleNode>(modules);
      // update modules depending it
      modules.forEach((mod) => {
        mod.importers.forEach((imp) => importers.add(imp));
      });
      return Array.from(importers);
    },
    async transform(code, id) {
      if (!availableExtensionRe.test(id) || id.includes('node_modules')) {
        return;
      }
      if (importMetaHotRe.test(code)) {
        // It seems to be already added HMR snippets by other plugins
        return;
      }

      const footer = `
if (import.meta.hot) {
  import.meta.hot.accept((module) => {
    window.__MIRA_HMR__.update({ module, url: import.meta.url });
  });
}`;
      return {
        code: `${code}${footer}`,
      };
    },
  };
}
