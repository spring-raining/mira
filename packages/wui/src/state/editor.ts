import type { editor } from 'monaco-editor';
import { useCallback, useState } from 'react';
import { useRecoilCallback } from 'recoil';
import { activeBrickIdState, brickOrderState } from './atoms';
import { brickStateFamily, useBrick } from './brick';

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
  const { updateBrick } = useBrick(brickId);
  const [editorTextCache, setEditorTextCache] = useState<string>();

  const onEditorUpdate = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRefs[brickId] = editor;
    },
    [brickId]
  );

  const onMoveForwardCommand = useRecoilCallback(
    ({ snapshot }) => async () => {
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
    },
    [brickId]
  );

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
    },
    [brickId]
  );

  const onChange = useRecoilCallback(
    ({ snapshot }) => async (code: string) => {
      setEditorTextCache(code);
      const brick = await snapshot.getPromise(brickStateFamily(brickId));
      if (brick.type !== 'script') {
        updateBrick(code);
        return;
      }
    },
    [brickId, updateBrick, setEditorTextCache]
  );

  const onFocus = useRecoilCallback(
    ({ set }) => () => {
      set(activeBrickIdState, brickId);
    },
    [brickId]
  );

  const onBlur = useRecoilCallback(
    ({ snapshot }) => async () => {
      const brick = await snapshot.getPromise(brickStateFamily(brickId));
      if (brick.type === 'script' && typeof editorTextCache === 'string') {
        updateBrick(editorTextCache);
      }
      setEditorTextCache(undefined);
    },
    [brickId, updateBrick, editorTextCache, setEditorTextCache]
  );

  return {
    onEditorUpdate,
    onMoveForwardCommand,
    onMoveBackwardCommand,
    onChange,
    onFocus,
    onBlur,
  };
};
