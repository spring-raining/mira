export const hmrNamespace = '__MIRA_HMR__';
export const hmrUpdateEventName = '__MIRA_HMR_UPDATE__';

export const hmrPreambleCode = `const exports = {};
exports.update = (msg) => {
  const ev = new CustomEvent('${hmrUpdateEventName}', { detail: msg });
  window.dispatchEvent(ev);
};
window.${hmrNamespace} = exports;
`;
