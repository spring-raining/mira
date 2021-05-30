export const hmrNamespace = '__ASTEROID_HMR__';
export const hmrUpdateEventName = '__ASTEROID_HMR_UPDATE__';

export const hmrPreambleCode = `const exports = {};
exports.update = (msg) => {
  const ev = new CustomEvent('${hmrUpdateEventName}', { detail: msg });
  window.dispatchEvent(ev);
};
window.${hmrNamespace} = exports;
`;
