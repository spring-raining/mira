export const cancellable = (fn: () => void, ms = 100) => {
  const timer = setTimeout(fn, ms);
  return () => {
    clearTimeout(timer);
  };
};

export const debounce = <T extends unknown[]>(
  fn: (timer: { hasCancelled: () => boolean }) => (...args: T) => void,
  ms = 100,
) => {
  let cancel: () => void;
  return (...args: T) => {
    let cancelled = false;
    const hasCancelled = () => cancelled;
    cancel?.();
    const cancelFn = cancellable(() => fn({ hasCancelled })(...args), ms);
    cancel = () => {
      cancelled = true;
      cancelFn();
    };
  };
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noopAsync = async () => {};
