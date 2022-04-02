import { history, undo, redo } from '@codemirror/history';
import { EditorState } from '@codemirror/state';
import { EditorView, ViewUpdate, keymap } from '@codemirror/view';
import { useCallback, useMemo, useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { BrickId } from '../types';
import { useDebouncedCallback } from './../hooks/useDebouncedCallback';
import { activeBrickIdState, brickOrderState } from './atoms';
import { useBrick, brickStateFamily } from './brick';

const editorStates: Record<BrickId, EditorState> = {};
const stateToViewMap = new WeakMap<EditorState, EditorView>();
export const destroyEditorState = (id: BrickId) => {
  const state = editorStates[id];
  if (state) {
    stateToViewMap.delete(state);
    delete editorStates[id];
  }
};

export const useEditorState = ({ brickId }: { brickId: BrickId }) => {
  const brick = useRecoilValue(brickStateFamily(brickId));
  const { setSwap, applySwap } = useBrick(brickId);

  const onMoveForwardCommand = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        const brickOrder = await snapshot.getPromise(brickOrderState);
        const idx = brickOrder.findIndex((id) => id === brickId);
        if (idx < 0 && brickId.length - 1 <= idx) {
          return;
        }
        const nextBrickId = brickOrder
          .slice(idx + 1)
          .find((id) => !!editorStates[id]);
        const view =
          nextBrickId && stateToViewMap.get(editorStates[nextBrickId]);
        if (!view) {
          return;
        }
        set(activeBrickIdState, nextBrickId);
        view.focus();
        view.dispatch(
          view.state.update({
            selection: { anchor: 0 },
            scrollIntoView: true,
            userEvent: 'select',
          }),
        );
      },
    [brickId],
  );

  const onMoveBackwardCommand = useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        const brickOrder = await snapshot.getPromise(brickOrderState);
        const idx = brickOrder.findIndex((id) => id === brickId);
        if (idx < 1) {
          return;
        }
        const prevBrickId = brickOrder
          .slice(0, idx)
          .reverse()
          .find((id) => !!editorStates[id]);
        const view =
          prevBrickId && stateToViewMap.get(editorStates[prevBrickId]);
        if (!view) {
          return;
        }
        set(activeBrickIdState, prevBrickId);
        view.focus();
        view.dispatch(
          view.state.update({
            selection: { anchor: view.state.doc.length },
            scrollIntoView: true,
            userEvent: 'select',
          }),
        );
      },
    [brickId],
  );

  const viewUpdateListener = useRecoilCallback(
    ({ set }) =>
      (update: ViewUpdate) => {
        const doc = update.state.doc.toString();
        if (update.docChanged) {
          setSwap(doc);
        }
        if (update.focusChanged) {
          if (update.view.hasFocus) {
            set(activeBrickIdState, brickId);
          } else {
            applySwap();
          }
        }
      },
    [brickId, setSwap, applySwap],
  );
  const debouncedViewUpdateListener = useDebouncedCallback(
    viewUpdateListener,
    66,
  );

  const editorState = useMemo((): EditorState => {
    let state = editorStates[brickId];
    if (!state) {
      const handleCursorPageUp = ({ state }: EditorView) => {
        if (state.selection.main.anchor === 0) {
          onMoveBackwardCommand();
          return true;
        }
        return false;
      };
      const handleCursorPageDown = ({ state }: EditorView) => {
        if (state.selection.main.anchor === state.doc.length) {
          onMoveForwardCommand();
          return true;
        }
        return false;
      };

      state = EditorState.create({
        doc: brick?.text,
        extensions: [
          history(),
          keymap.of([
            { key: 'Mod-z', run: undo, preventDefault: true },
            {
              key: 'Mod-y',
              mac: 'Mod-Shift-z',
              run: redo,
              preventDefault: true,
            },
            {
              key: 'Mod-ArrowUp',
              run: handleCursorPageUp,
            },
            {
              key: 'Mod-ArrowDown',
              run: handleCursorPageDown,
            },
          ]),
          EditorView.updateListener.of(debouncedViewUpdateListener),
        ],
      });
      editorStates[brickId] = state;
    }
    return state;
  }, [
    brickId,
    brick,
    debouncedViewUpdateListener,
    onMoveForwardCommand,
    onMoveBackwardCommand,
  ]);

  const setEditorView = useCallback(
    (editorView: EditorView) => {
      stateToViewMap.set(editorState, editorView);
    },
    [editorState],
  );
  useEffect(
    () => () => {
      stateToViewMap.delete(editorState);
    },
    [editorState],
  );

  return { editorState, setEditorView };
};
