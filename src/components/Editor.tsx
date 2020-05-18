import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { editor } from 'monaco-editor';
import MonacoEditor, {
  EditorDidMount,
  monaco as _monaco,
  Monaco,
} from '@monaco-editor/react';
import theme from '../theme';

const useAsyncEvent = (callback: (...args: any[]) => void) => {
  const eventStack = useRef<any[][]>([]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      if (eventStack.current.length > 0) {
        callback(...eventStack.current.shift());
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

export interface EditorProps {
  code?: string;
  language?: 'javascript' | 'markdown';
  onEditorUpdate?: (editor: any) => void;
  onChange?: (code: string) => void;
  onCreateNewBlockCommand?: () => void;
  onMoveForwardCommand?: () => void;
  onMoveBackwardCommand?: () => void;
  onFocus?: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  code,
  language,
  onEditorUpdate = () => {},
  onChange = () => {},
  onCreateNewBlockCommand = () => {},
  onMoveForwardCommand = () => {},
  onMoveBackwardCommand = () => {},
  onFocus = () => {},
}) => {
  const lineHeight = 18;
  const [height, setHeight] = useState(0);
  const [initialOptions, setInitialOptions] = useState<object>(null);
  const [initialCode] = useState(() => code);

  const [monaco, setMonaco] = useState<Monaco>(null);
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>(null);

  const createNewBlockCommandHandler = useAsyncEvent(onCreateNewBlockCommand);
  const moveForwardCommandHandler = useAsyncEvent(onMoveForwardCommand);
  const moveBackwardCommandHandler = useAsyncEvent(onMoveBackwardCommand);
  const focusHandler = useAsyncEvent(onFocus);
  const changeHandler = useAsyncEvent(onChange);

  // 1. get Monaco instance
  useEffect(() => {
    if (!monaco) {
      _monaco.init().then(setMonaco);
    } else {
      monaco.editor.defineTheme('myTheme', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#00000000',
        },
      });

      //       monaco.languages.typescript.typescriptDefaults.addExtraLib(
      //         `
      // // declare module '*';
      // export declare function $run(runner: any): void;
      // `,
      //         'global.d.ts'
      //       );

      //       if (monaco.editor.getModels().length === 0) {
      //         const dts = monaco.editor.createModel(
      //           'declare var $run: (runner: any) => void;',
      //           'typescript',
      //           monaco.Uri.from({ schema: 'file', path: '/index.d.ts' })
      //         );
      //         const jsconfig = monaco.editor.createModel(
      //           JSON.stringify({
      //             compilerOptions: {},
      //           }),
      //           'json',
      //           monaco.Uri.from({ schema: 'file', path: '/jsconfig.json' })
      //         );
      //       }

      // const ext = language === 'javascript' ? 'js' : 'md';
      setInitialOptions({
        // model: monaco.editor.createModel(
        //   code,
        //   'javascript',
        //   monaco.Uri.from({ schema: 'file', path: `file_${nanoid()}.${ext}` })
        // ),
        minimap: { enabled: false },
        fontFamily: theme.fonts.mono,
        lineHeight,
        lineNumbersMinChars: 8,
        scrollBeyondLastLine: false,
        scrollbar: {
          alwaysConsumeMouseWheel: false,
        },
      });
    }
  }, [monaco]);

  // 2. mount editor component and handle editor changes
  const editorDidMount: EditorDidMount = (
    getEditorValue,
    editor: editor.IStandaloneCodeEditor
  ) => {
    setEditor(editor);
    onEditorUpdate(editor);
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
      const value = getEditorValue();
      changeHandler(value);
    });
    editor.onDidFocusEditorText(focusHandler);
  };

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
      const lineCount = editor.getModel()?.getLineCount() || 1;
      const height = editor.getTopForLineNumber(lineCount + 5) + lineHeight;
      if (prevHeight !== height) {
        prevHeight = height;
        requestAnimationFrame(() => {
          el.style.height = `${height}px`;
          setHeight(height);
          editor.layout();
        });
      }
    };
    updateEditorHeight();
    editor.onDidChangeModelDecorations(() => {
      updateEditorHeight(); // typing
      requestAnimationFrame(updateEditorHeight); // folding
    });
  }, [editor]);

  return (
    <div style={{ height }}>
      {initialOptions && (
        <MonacoEditor
          value={initialCode}
          language={language}
          options={initialOptions}
          theme="myTheme"
          editorDidMount={editorDidMount}
          loading={<></>}
        />
      )}
    </div>
  );
};
