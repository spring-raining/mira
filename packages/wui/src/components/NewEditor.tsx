import { EditorView } from '@codemirror/view';
import React, { useEffect, useRef } from 'react';
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
  language?: string;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
}

export const Editor: React.VFC<EditorProps> = ({
  brickId,
  language,
  errorMarkers,
  warnMarkers,
}) => {
  const { editorState, setEditorView } = useEditorState({ brickId });
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | undefined>();

  useEffect(() => {
    if (!editorContainerRef.current) {
      return;
    }
    const editorView = new EditorView({
      state: editorState,
      parent: editorContainerRef.current,
    });
    editorViewRef.current = editorView;
    setEditorView(editorView);
    return () => {
      editorViewRef.current?.destroy();
      editorViewRef.current = undefined;
    };
  }, [editorState, setEditorView]);

  return <div ref={editorContainerRef} />;
};
