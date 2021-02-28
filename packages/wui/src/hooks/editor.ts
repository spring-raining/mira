import type { editor } from 'monaco-editor';
import { useCallback } from 'react';
import { useRecoilCallback } from 'recoil';
import { activeBrickIdState, brickOrderState } from '../atoms';

// Setting to recoil atoms seems to occur errors
export const editorRefs: Record<string, editor.IStandaloneCodeEditor> = {};

const hasIntersect = (
  el: HTMLElement,
  { top = 0, bottom = 0 }: { top?: number; bottom?: number } = {}
): boolean => {
  const rect = el.getBoundingClientRect();
  return (
    rect.top <= window.innerHeight + bottom && rect.top + rect.height >= top
  );
};

export const useEditorCallbacks = ({ brickId }: { brickId: string }) => {
  const onEditorUpdate = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRefs[brickId] = editor;
    },
    [brickId]
  );

  const onMoveForwardCommand = useRecoilCallback(({ snapshot }) => async () => {
    const brickOrder = await snapshot.getPromise(brickOrderState);
    const idx = brickOrder.findIndex((id) => id === brickId);
    if (idx < 0 && brickId.length - 1 <= idx) {
      return;
    }
    const nextBrickId = brickOrder
      .slice(idx + 1)
      .find((id) => !!editorRefs[id]);
    if (!nextBrickId) {
      return;
    }
    editorRefs[nextBrickId].focus();
    editorRefs[nextBrickId].setPosition({ lineNumber: 1, column: 0 });
    const containerDom = editorRefs[nextBrickId].getContainerDomNode();
    if (containerDom && !hasIntersect(containerDom)) {
      containerDom.scrollIntoView(false);
    }
  });

  const onMoveBackwardCommand = useRecoilCallback(
    ({ snapshot }) => async () => {
      const brickOrder = await snapshot.getPromise(brickOrderState);
      const idx = brickOrder.findIndex((id) => id === brickId);
      if (idx < 1) {
        return;
      }
      const prevBrickId = brickOrder
        .slice(0, idx)
        .reverse()
        .find((id) => !!editorRefs[id]);
      if (!prevBrickId) {
        return;
      }
      editorRefs[prevBrickId].focus();
      editorRefs[prevBrickId].setPosition({
        lineNumber: Infinity,
        column: Infinity,
      });
      const containerDom = editorRefs[prevBrickId].getContainerDomNode();
      if (containerDom && !hasIntersect(containerDom, { top: 100 })) {
        containerDom.scrollIntoView(true);
        // scroll downward by header height
        window.scrollBy(0, -100);
      }
    }
  );

  const onFocus = useRecoilCallback(({ set }) => () => {
    set(activeBrickIdState, brickId);
  });

  return {
    onEditorUpdate,
    onMoveForwardCommand,
    onMoveBackwardCommand,
    onFocus,
  };
};
