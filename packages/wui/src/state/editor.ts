import { undo, redo } from '@codemirror/history';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, ViewUpdate, keymap } from '@codemirror/view';
import { useCallback, useMemo, useEffect } from 'react';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { editorExtension } from '../editor/extension';
import { BrickId } from '../types';
import { editorKeymap } from './../editor/keymap';
import { useDebouncedCallback } from './../hooks/useDebouncedCallback';
import { activeBrickIdState, brickOrderState } from './atoms';
import { useBrick, brickStateFamily } from './brick';

export interface MiraBrickEditorData {
  editorState: EditorState;
  languageCompartment: Compartment;
}

const editorStates: Record<BrickId, MiraBrickEditorData> = {};
const stateToViewMap = new WeakMap<EditorState, EditorView>();
export const destroyEditorState = (id: BrickId) => {
  const state = editorStates[id];
  if (state) {
    stateToViewMap.delete(state.editorState);
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
          nextBrickId &&
          stateToViewMap.get(editorStates[nextBrickId]?.editorState);
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
          prevBrickId &&
          stateToViewMap.get(editorStates[prevBrickId]?.editorState);
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

  const { editorState, languageCompartment } =
    useMemo((): MiraBrickEditorData => {
      if (editorStates[brickId]) {
        return editorStates[brickId];
      }

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

      const languageCompartment = new Compartment();
      const editorState = EditorState.create({
        doc: brick?.text,
        extensions: [
          editorExtension,
          languageCompartment.of([]),
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
            ...editorKeymap,
          ]),
          EditorView.updateListener.of(debouncedViewUpdateListener),
        ],
      });
      return (editorStates[brickId] = {
        languageCompartment,
        editorState,
      });
    }, [
      brickId,
      brick,
      debouncedViewUpdateListener,
      onMoveForwardCommand,
      onMoveBackwardCommand,
    ]);

  const setEditorViewSingleton = useCallback(
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

  return { editorState, languageCompartment, setEditorViewSingleton };
};
