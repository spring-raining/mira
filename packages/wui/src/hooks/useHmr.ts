import { useCallback, useRef } from 'react';
import { RefreshModuleEvent } from '../types';

export const useHmr = () => {
  const hmrCallbacks = useRef<((message: RefreshModuleEvent) => void)[]>([]);

  const refreshModule = useCallback((message: RefreshModuleEvent) => {
    [...hmrCallbacks.current].forEach((fn) => {
      fn(message);
    });
  }, []);
  const addRefreshModuleListener = useCallback(
    (fn: (message: RefreshModuleEvent) => void) => {
      hmrCallbacks.current.push(fn);
    },
    []
  );
  const removeRefreshModuleListener = useCallback(
    (fn: (message: RefreshModuleEvent) => void) => {
      hmrCallbacks.current = hmrCallbacks.current.filter((f) => f !== fn);
    },
    []
  );

  return {
    refreshModule,
    addRefreshModuleListener,
    removeRefreshModuleListener,
  };
};
