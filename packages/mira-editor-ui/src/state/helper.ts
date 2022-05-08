import { EditorState } from '@codemirror/state';
import { selectorFamily, DefaultValue, RecoilState } from 'recoil';
import { ASTNode, Brick } from '../types';
import { genBrickId, genMiraId } from '../util';
import { editorExtension, editorStateFieldMap } from './../editor/extension';

export const getDictItemSelector = <T, P extends string | number | symbol>({
  key,
  state,
}: {
  key: string;
  state: RecoilState<Record<P, T>>;
}) =>
  selectorFamily<T | undefined, P>({
    key,
    get:
      (param) =>
      ({ get }) =>
        get(state)[param],
    set:
      (param) =>
      ({ set }, newValue) => {
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

export const createNewBrick = ({
  type,
  text,
  language,
  ast,
  isLived,
}: {
  type: Brick['type'];
  text?: string;
  language?: string;
  ast?: ASTNode[];
  isLived?: boolean;
}): Brick => {
  const editorState = EditorState.create({
    doc: text ?? '',
    extensions: [editorExtension],
  });

  if (type === 'snippet') {
    return {
      id: genBrickId(),
      type,
      language: language ?? '',
      text: text ?? '',
      codeEditor: {
        state: editorState.toJSON(editorStateFieldMap),
      },
      ...(ast && { ast }),
      ...(isLived && {
        mira: {
          id: genMiraId(),
          isLived,
        },
      }),
    };
  }
  return {
    id: genBrickId(),
    type,
    text: text ?? '',
    codeEditor: {
      state: editorState.toJSON(editorStateFieldMap),
    },
    ...(ast && { ast }),
    ...(isLived && {
      mira: {
        id: genMiraId(),
        isLived,
      },
    }),
  };
};
