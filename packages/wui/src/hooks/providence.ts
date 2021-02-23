import { useCallback } from 'react';
// import { nanoid } from "nanoid";
import { Either } from '../atoms';

export const useProvidence = () => {
  const evaluate = useCallback((renderer: Promise<Either<Error, unknown>>) => {
    // const runId = nanoid();
    requestAnimationFrame(() => {
      renderer
        .then(([error, evaluated]) => {
          // TODO
        });
    });
  }, []);

  return { evaluate };
};
