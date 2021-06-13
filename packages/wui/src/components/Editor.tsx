import { styled } from '@linaria/react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor, {
  loader as editorLoader,
  OnMount as OnEditorMount,
  BeforeMount as BeforeEditorMount,
  Monaco,
} from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

export interface EditorLoaderConfig {
  paths?: {
    vs?: string;
  };
  'vs/nls'?: {
    availableLanguages?: object;
  };
}

const useAsyncEvent = (callback: (...args: any[]) => void) => {
  const eventStack = useRef<any[][]>([]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      if (eventStack.current.length > 0) {
        callback(...eventStack.current.shift()!);
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [callback]);

  const handler = useCallback((...args) => {
    eventStack.current.push(args);
  }, []);
  return handler;
};

const EditorContainer = styled.div`
  height: 100%;
`;

export interface MarkerMessage {
  location: {
    line: number;
    column: number;
    length: number;
  };
  text: string;
}

export interface EditorProps {
  code?: string;
  language?: string;
  readOnly?: boolean;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
  padding?: {
    top?: number;
    bottom?: number;
  };
  editorLoaderConfig?: EditorLoaderConfig;
  onEditorUpdate?: (
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => void;
  onChange?: (code: string) => void;
  onCreateNewBlockCommand?: () => void;
  onMoveForwardCommand?: () => void;
  onMoveBackwardCommand?: () => void;
  onFocus?: () => void;
}

export const editorFontFamily =
  'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace';

export const Editor: React.FC<EditorProps> = ({
  code,
  language,
  readOnly = false,
  errorMarkers,
  warnMarkers,
  padding = {
    top: 24,
    bottom: 24,
  },
  editorLoaderConfig,
  onEditorUpdate = () => {},
  onChange = () => {},
  onCreateNewBlockCommand = () => {},
  onMoveForwardCommand = () => {},
  onMoveBackwardCommand = () => {},
  onFocus = () => {},
}) => {
  const [initialCode] = useState(() => code);
  const [canLoadEditor, setCanLoadEditor] = useState(false);
  const [monaco, setMonaco] = useState<Monaco | null>(null);
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor | null>(
    null
  );
  const createNewBlockCommandHandler = useAsyncEvent(onCreateNewBlockCommand);
  const moveForwardCommandHandler = useAsyncEvent(onMoveForwardCommand);
  const moveBackwardCommandHandler = useAsyncEvent(onMoveBackwardCommand);
  const focusHandler = useAsyncEvent(onFocus);
  const changeHandler = useAsyncEvent(onChange);

  // 1. get Monaco instance
  const beforeEditorMount: BeforeEditorMount = (monaco) => {
    if (!monaco) {
      return;
    }
    monaco.editor.defineTheme('miraLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    });
    monaco.editor.defineTheme('miraDarkTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    });
  };

  // 2. mount editor component and handle editor changes
  const onEditorMount: OnEditorMount = (editor, monaco) => {
    if (!monaco) {
      return;
    }
    setEditor(editor);
    onEditorUpdate(editor, monaco);
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      createNewBlockCommandHandler
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow,
      moveBackwardCommandHandler
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow,
      moveForwardCommandHandler
    );
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      changeHandler(value);
    });
    editor.onDidFocusEditorText(focusHandler);
  };

  useEffect(() => {
    if (editorLoaderConfig) {
      editorLoader.config(editorLoaderConfig);
    }
    const cancellable = editorLoader.init() as Promise<any> & {
      cancel: () => void;
    };
    cancellable.then((monaco) => {
      setMonaco(monaco);
      setCanLoadEditor(true);
    });
    return () => cancellable?.cancel();
  }, [editorLoaderConfig]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    // https://github.com/microsoft/monaco-editor/issues/794
    let prevHeight = 0;
    const updateEditorHeight = () => {
      const el = editor.getDomNode();
      if (!el) {
        return;
      }
      const contentHeight = editor.getContentHeight();
      if (prevHeight !== contentHeight) {
        prevHeight = contentHeight;
        requestAnimationFrame(() => {
          el.style.height = `${contentHeight}px`;
          editor.layout();
        });
      }
    };
    updateEditorHeight();
    editor.onDidContentSizeChange(() => {
      updateEditorHeight();
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.updateOptions({ readOnly });
  }, [editor, readOnly]);

  useEffect(() => {
    const model = editor?.getModel();
    if (!monaco || !model) {
      return;
    }
    const markers = [
      ...(errorMarkers ?? []).map(({ location, text }) => ({
        startLineNumber: location.line,
        startColumn: location.column + 1,
        endLineNumber: location.line,
        endColumn: location.column + location.length + 1,
        message: text,
        severity: monaco.MarkerSeverity.Error,
      })),
      ...(warnMarkers ?? []).map(({ location, text }) => ({
        startLineNumber: location.line,
        startColumn: location.column + 1,
        endLineNumber: location.line,
        endColumn: location.column + location.length + 1,
        message: text,
        severity: monaco.MarkerSeverity.Warning,
      })),
    ];
    monaco.editor.setModelMarkers(model, 'customMarkers', markers);
  }, [monaco, editor, errorMarkers, warnMarkers]);

  // FIXME: Support JSX/TSX language
  if (language === 'jsx') {
    language = 'javascript';
  } else if (language === 'tsx') {
    language = 'typescript';
  }

  if (!canLoadEditor) {
    return null;
  }
  return (
    <EditorContainer>
      <MonacoEditor
        defaultValue={initialCode}
        language={language}
        options={{
          minimap: { enabled: false },
          fontFamily: editorFontFamily,
          lineHeight: 18,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
            vertical: 'hidden',
            verticalScrollbarSize: 0,
          },
          padding,
        }}
        theme="miraLightTheme"
        loading={<></>}
        beforeMount={beforeEditorMount}
        onMount={onEditorMount}
      />
    </EditorContainer>
  );
};
