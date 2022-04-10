import { undo, redo } from '@codemirror/history';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, ViewUpdate, keymap } from '@codemirror/view';
import { useCallback, useMemo, useEffect } from 'react';
import { useRecoilCallback } from 'recoil';
import { editorExtension, editorStateFieldMap } from '../editor/extension';
import { BrickId } from '../types';
import { editorKeymap } from './../editor/keymap';
import { useDebouncedCallback } from './../hooks/useDebouncedCallback';
import { activeBrickIdState, brickOrderState } from './atoms';
import { useBrick } from './brick';

export interface MiraBrickEditorData {
  editorState: EditorState;
  configurable: {
    language: Compartment;
  };
}

const editorViewMap = new Map<BrickId, EditorView>();

export const useEditorState = ({
  brickId,
  editorView,
}: {
  brickId: BrickId;
  editorView?: EditorView;
}) => {
  const { brick, setSwap, applySwap } = useBrick(brickId);

  useEffect(() => {
    if (!editorView) {
      return;
    }
    editorViewMap.set(brickId, editorView);
    return () => {
      editorViewMap.delete(brickId);
    };
  }, [brickId, editorView]);

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
          .find((id) => editorViewMap.has(id));
        const view = nextBrickId && editorViewMap.get(nextBrickId);
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
          .find((id) => editorViewMap.has(id));
        const view = prevBrickId && editorViewMap.get(prevBrickId);
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

  const docChangeListener = useCallback(
    (update: ViewUpdate) => {
      if (update.docChanged) {
        setSwap({
          state: update.state.toJSON(editorStateFieldMap),
        });
      }
    },
    [setSwap],
  );
  const debouncedDocChangeListener = useDebouncedCallback(
    docChangeListener,
    33,
  );

  const updateListener = useRecoilCallback(
    ({ set }) =>
      (update: ViewUpdate) => {
        if (update.focusChanged) {
          if (update.view.hasFocus) {
            set(activeBrickIdState, brickId);
          } else {
            applySwap();
          }
        }
      },
    [brickId, applySwap],
  );

  const { editorState, configurable } = useMemo((): MiraBrickEditorData => {
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
    const language = new Compartment();
    const editorState = EditorState.fromJSON(
      brick.codeEditor.state,
      {
        extensions: [
          editorExtension,
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
          EditorView.updateListener.of(debouncedDocChangeListener),
          EditorView.updateListener.of(updateListener),
          language.of([]),
        ],
      },
      editorStateFieldMap,
    );
    return {
      editorState,
      configurable: {
        language,
      },
    };
  }, [
    brick,
    onMoveBackwardCommand,
    onMoveForwardCommand,
    debouncedDocChangeListener,
    updateListener,
  ]);

  return {
    editorState,
    configurable,
  };
};
