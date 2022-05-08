import React, { useCallback } from 'react';
import { noop } from '../util';

export const useStop = <
  T = Element,
  E = Event,
  EV extends React.SyntheticEvent<T, E> = React.SyntheticEvent<T, E>,
>(
  fn: (event: EV) => void = noop,
) =>
  useCallback((e: EV) => {
    e.stopPropagation();
    return fn(e);
  }, []);
