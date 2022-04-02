import { useEffect, useRef, useCallback } from 'react';
import { cancellable } from '../util';

export const useDebouncedCallback = <T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
  deps: ReadonlyArray<unknown> = [],
) => {
  const canceller = useRef<(() => void)[]>([]);
  const cancel = () => {
    let doCancel: (() => void) | undefined;
    while ((doCancel = canceller.current.pop())) {
      doCancel();
    }
  };
  useEffect(cancel, [fn, ms, deps]);

  const callback = useCallback(
    (...args: T) => {
      let cancelled = false;
      cancel();
      const cancelFn = cancellable(() => !cancelled && fn(...args), ms);
      canceller.current.push(() => {
        cancelled = true;
        cancelFn();
      });
    },
    [fn, ms],
  );
  return callback;
};
