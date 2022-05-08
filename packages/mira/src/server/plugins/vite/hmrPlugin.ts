import { ModuleNode, Plugin } from 'vite';

const availableExtensionRe = /\.m?(t|j)sx?$/;
const importMetaHotRe = /import\s*\.\s*meta\s*\.\s*hot/g;

const getHmrFooter = ({ base }: { base: string }) => `
if (import.meta.hot) {
  let updatePayload;
  import.meta.hot.on('vite:beforeUpdate', (payload) => {
    updatePayload = payload.updates;
  });
  import.meta.hot.on('vite:beforeFullReload', (payload)=> {
    console.log(payload);
  });
  import.meta.hot.accept((module) => {
    const base = ${JSON.stringify(base)};
    const url = new URL(import.meta.url);
    const path = url.pathname.substring(base.length - 1);
    const viteUpdate = updatePayload.find(
      (update) =>
        update.type === 'js-update' &&
        update.path === path &&
        update.acceptedPath === path,
    );
    if (viteUpdate) {
      window.__MIRA_HMR__.update({
        module,
        viteUpdate,
        url: import.meta.url,
      });
    }
  });
}
`;

export function hmrVitePlugin({ base }: { base: string }): Plugin {
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
      const footer = getHmrFooter({ base });
      return {
        code: `${code}${footer}`,
      };
    },
  };
}
