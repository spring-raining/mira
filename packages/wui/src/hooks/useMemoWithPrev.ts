import { useRef, useMemo } from 'react';

export const useMemoWithPrev = <T = unknown>(
  fn: (prevValue: T | undefined) => T,
  deps: unknown[],
) => {
  const previous = useRef<T | undefined>();
  const value = useMemo(() => {
    previous.current = fn(previous.current);
    return previous.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, ...deps]);

  return value;
};
