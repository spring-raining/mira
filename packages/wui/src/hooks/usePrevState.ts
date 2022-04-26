import { useRef, useEffect } from 'react';

export const usePrevState = <T>(state: T): [T, T | undefined] => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = state;
  });
  return [state, ref.current];
};
