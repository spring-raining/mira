import { EditorView } from '@codemirror/view';
import React, { useEffect, useRef, useState } from 'react';
import { getLanguageExtension } from '../editor/language';
import { useBrick } from '../state/brick';
import { useEditorState } from '../state/editor';
import { BrickId } from '../types';

export const useRefFromProp = <T extends unknown>(
  prop: T,
): React.MutableRefObject<T> => {
  const ref = useRef(prop);
  ref.current = prop;
  return ref;
};

export interface MarkerMessage {
  location: {
    line: number;
    column: number;
    length: number;
  };
  text: string;
}

export interface EditorProps {
  brickId: BrickId;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
}

export const Editor: React.VFC<EditorProps> = ({
  brickId,
  errorMarkers,
  warnMarkers,
}) => {
  const { brick, isActive } = useBrick(brickId);
  const [editorView, setEditorView] = useState<EditorView>();
  const { editorState, configurable } = useEditorState({
    brickId,
    editorView,
  });
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorContainerRef.current) {
      return;
    }
    if (editorView) {
      editorView.setState(editorState);
    } else {
      const editorView = new EditorView({
        state: editorState,
        parent: editorContainerRef.current,
      });
      setEditorView(editorView);
    }
  }, [editorState, editorView]);

  useEffect(
    () => () => {
      editorView?.destroy();
    },
    [editorView],
  );

  useEffect(() => {
    if (!editorView) {
      return;
    }
    const language =
      brick?.type === 'snippet'
        ? brick.language
        : brick?.type === 'note'
        ? 'markdown'
        : brick?.type === 'script'
        ? 'jsx'
        : '';
    editorView.dispatch({
      effects: configurable.language.reconfigure(
        getLanguageExtension(language),
      ),
    });
  }, [brick, editorView, configurable]);

  useEffect(() => {
    if (isActive) {
      editorView?.focus();
    } else {
      editorView?.contentDOM.blur();
    }
  }, [editorView, isActive]);

  return <div ref={editorContainerRef} />;
};
