export const hmrUpdateEventName = '__ASTEROID_HMR_UPDATE__';

export const hmrPreambleCode = `
{
  const exports = {};
  exports.update = (msg) => {
    const ev = new CustomEvent('${hmrUpdateEventName}', { detail: msg });
    window.dispatchEvent(ev);
  };
  window.__ASTEROID_HMR__ = exports;
}
`;
