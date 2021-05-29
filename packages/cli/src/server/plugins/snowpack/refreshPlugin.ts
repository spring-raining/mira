import { SnowpackPluginFactory } from 'snowpack';

const importMetaHotRe = /import\s*\.\s*meta\s*\.\s*hot/g;

const transformJs = (contents: string) => {
  if (importMetaHotRe.test(contents)) {
    // It seems to be already added HMR snippets by other plugins
    return contents;
  }
  return `${contents}

if (import.meta.hot) {
  import.meta.hot.accept((e) => {
    window.__ASTEROID_HMR__.update({ ...e, url: import.meta.url });
  });
}`;
};

export const refreshPluginFactory: SnowpackPluginFactory = () => ({
  name: 'asteroid-hmr-refresh',
  async transform({ contents, fileExt, isDev, isHmrEnabled, isSSR }) {
    if (!isHmrEnabled || !isDev) {
      return;
    }
    if (fileExt === '.js' && !isSSR) {
      return transformJs(
        typeof contents === 'string' ? contents : contents.toString()
      );
    }
  },
});
