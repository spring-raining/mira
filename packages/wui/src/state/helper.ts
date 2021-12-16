import { selectorFamily, DefaultValue, RecoilState } from 'recoil';

export const getDictItemSelector = <T, P extends string | number | symbol>({
  key,
  state,
}: {
  key: string;
  state: RecoilState<Record<P, T>>;
}) =>
  selectorFamily<T | undefined, P>({
    key,
    get: (param) => ({ get }) => get(state)[param],
    set: (param) => ({ set }, newValue) => {
      if (!(newValue instanceof DefaultValue)) {
        set(state, (prevState) => {
          const newState = { ...prevState };
          if (newValue) {
            newState[param] = newValue;
          } else {
            delete newState[param];
          }
          return newState;
        });
      }
    },
  });
