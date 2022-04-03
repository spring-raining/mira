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
  const { brick } = useBrick(brickId);
  const { editorState, languageCompartment, setEditorViewSingleton } =
    useEditorState({
      brickId,
    });
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView>();

  useEffect(() => {
    if (!editorContainerRef.current) {
      return;
    }
    const editorView = new EditorView({
      state: editorState,
      parent: editorContainerRef.current,
    });
    setEditorView(editorView);
    setEditorViewSingleton(editorView);
    return () => {
      editorView.destroy();
    };
  }, [editorState, setEditorViewSingleton]);

  useEffect(() => {
    if (!editorView || !languageCompartment) {
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
      effects: languageCompartment.reconfigure(getLanguageExtension(language)),
    });
  }, [brick, editorView, languageCompartment]);

  return <div ref={editorContainerRef} />;
};
