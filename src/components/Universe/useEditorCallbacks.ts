import { useCallback, useContext } from 'react';
import type { editor } from 'monaco-editor';
import { UniverseContext } from '../../contexts/universe';
import { useRuler } from './useRuler';

const editorRefs: { [key: string]: editor.IStandaloneCodeEditor } = {};

export const useEditorCallbacks = ({ brickId }: { brickId: string }) => {
  const { state, dispatch } = useContext(UniverseContext);
  const { insertCodeBlock } = useRuler(state);
  const { bricks } = state;

  const onEditorUpdate = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRefs[brickId] = editor;
    },
    [brickId]
  );

  const onCreateNewBlockCommand = useCallback(() => {
    let idx = bricks.findIndex((brick) => brick.brickId === brickId);
    if (0 <= idx) {
      if (idx < bricks.length - 1 && bricks[idx + 1].noteType === 'script') {
        // skip next script brick
        idx += 1;
      }
      const newState = insertCodeBlock(idx + 1);
      const newBrickId = newState.bricks[idx + 1].brickId;
      dispatch(newState);
      // wait creating new editor
      setTimeout(() => {
        editorRefs[newBrickId]?.focus();
        editorRefs[newBrickId]?.getContainerDomNode().scrollIntoView(false);
      }, 200);
    }
  }, [state, brickId, dispatch]);

  const onMoveForwardCommand = useCallback(() => {
    const idx = bricks.findIndex((brick) => brick.brickId === brickId);
    if (0 <= idx && idx < bricks.length - 1) {
      const nextBrick = bricks
        .slice(idx + 1)
        .find((b) => editorRefs[b.brickId]);
      if (nextBrick) {
        editorRefs[nextBrick.brickId]?.focus();
        editorRefs[nextBrick.brickId]
          ?.getContainerDomNode()
          .scrollIntoView(false);
      }
    }
  }, [state, brickId]);

  const onMoveBackwardCommand = useCallback(() => {
    const idx = bricks.findIndex((brick) => brick.brickId === brickId);
    if (idx >= 1) {
      const prevBrick = bricks
        .slice(0, idx)
        .reverse()
        .find((b) => editorRefs[b.brickId]);
      if (prevBrick) {
        editorRefs[prevBrick.brickId]?.focus();
        editorRefs[prevBrick.brickId]
          ?.getContainerDomNode()
          .scrollIntoView(true);
        // scroll downward by header height
        window.scrollBy(0, -100);
      }
    }
  }, [state, brickId]);

  const onFocus = useCallback(() => {
    dispatch({
      activeBrick: brickId,
    });
  }, [brickId, dispatch]);

  const onChange = useCallback(
    (text) => {
      dispatch({
        bricks: state.bricks.map((brick) =>
          brick.brickId === brickId
            ? {
                ...brick,
                text,
                children: null,
              }
            : brick
        ),
      });
    },
    [brickId, state, dispatch]
  );

  return {
    onEditorUpdate,
    onCreateNewBlockCommand,
    onMoveForwardCommand,
    onMoveBackwardCommand,
    onFocus,
    onChange,
  };
};
