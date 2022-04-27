import { useCallback } from 'react';

// https://github.com/facebook/react/issues/13029#issuecomment-497641073
export const useCombinedRefs = <T extends any>(...refs: React.Ref<T>[]) =>
  useCallback((el: T) => {
    refs.forEach((ref) => {
      if (!ref) {
        return;
      }
      if (typeof ref === 'function') {
        return ref(el);
      }
      (ref as any).current = el;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
