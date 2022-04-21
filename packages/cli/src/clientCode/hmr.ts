const hmr: any = {};
hmr.update = (msg: any) => {
  const ev = new CustomEvent('__MIRA_HMR_UPDATE__', { detail: msg });
  window.dispatchEvent(ev);
};
window.__MIRA_HMR__ = hmr;

export {};
