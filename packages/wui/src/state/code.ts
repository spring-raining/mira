import { selector } from 'recoil';
import { ScriptBrick, SnippetBrick, Mira } from '../types';
import { brickDictState, brickTextSwapState } from './atoms';

export const codeFragmentsState = selector<
  Pick<SnippetBrick & { mira: Mira }, 'id' | 'text' | 'language' | 'mira'>[]
>({
  key: 'codeFragmentsState',
  get: ({ get }) => {
    const brickDict = get(brickDictState);
    const brickTextSwap = get(brickTextSwapState);
    const livedSnippets = Object.values(brickDict).filter(
      (v): v is SnippetBrick & { mira: Mira } =>
        v.type === 'snippet' && !!v.mira?.isLived,
    );
    return livedSnippets.map(({ id, text, language, mira }) => {
      const ret = { id, text, language, mira };
      const swap = brickTextSwap[id];
      if (swap) {
        ret.text = swap.text;
        if (swap.mira) {
          ret.mira = swap.mira;
        }
      }
      return ret;
    });
  },
});

export const scriptFragmentsState = selector<ScriptBrick[]>({
  key: 'scriptFragmentsState',
  get: ({ get }) => {
    const brickDict = get(brickDictState);
    const scripts = Object.values(brickDict).filter(
      (v): v is ScriptBrick => v.type === 'script',
    );
    return scripts;
  },
});
