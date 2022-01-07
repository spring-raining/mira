import { useCallback } from 'react';
import { useUniverseContext } from '../context';

export const useInViewBrickState = () => {
  const { __cache } = useUniverseContext();
  const updateInViewState = useCallback(
    (brickId: string, inView: boolean) => {
      if (inView) {
        __cache.current.inViewState.add(brickId);
      } else {
        __cache.current.inViewState.delete(brickId);
      }
    },
    [__cache],
  );

  return {
    updateInViewState,
  };
};
