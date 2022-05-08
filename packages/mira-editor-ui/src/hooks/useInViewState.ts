import { useCallback } from 'react';
import { useUniverseContext } from '../context';

export const useInViewBrickState = () => {
  const { __cache } = useUniverseContext();
  const updateInViewState = useCallback(
    (inViewState: string[]) => {
      __cache.current.inViewState = inViewState;
    },
    [__cache],
  );

  return {
    updateInViewState,
  };
};
