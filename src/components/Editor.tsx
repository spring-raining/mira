import React, { useState, useCallback, useEffect } from 'react';
import MonacoEditor, {
  EditorDidMount,
  monaco as _monaco,
} from '@monaco-editor/react';

export const Editor: React.FC<{
  code?: string;
  language?: string;
  onChange?: (code: string) => void;
}> = ({ code, language, onChange = () => {} }) => {
  const lineHeight = 18;
  const [height, setHeight] = useState(0);
  const [currentValue, setCurrentValue] = useState(() => code);

  const [monaco, setMonaco] = useState(null);
  const [editor, setEditor] = useState(null);
  const editorDidMount: EditorDidMount = useCallback(
    (getEditorValue, editor) => {
      setEditor(editor);
      editor.onDidChangeModelContent(() => {
        const value = getEditorValue();
        setCurrentValue(value);
        onChange(value);
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!monaco) {
      _monaco.init().then(setMonaco);
    }
  }, [monaco]);

  useEffect(() => {
    if (!monaco || !editor) {
      return;
    }

    monaco.editor.defineTheme('myTheme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#00000000',
      },
    });

    //     monaco.languages.typescript.typescriptDefaults.addExtraLib(
    //       `
    //  declare module '*';
    //  declare function $run(runner: any): void;
    //        `,
    //       'decls.d.ts'
    //     );
  }, [monaco, editor]);

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
      <MonacoEditor
        value={code}
        language={language}
        options={{
          minimap: { enabled: false },
          lineHeight,
          lineNumbersMinChars: 8,
          scrollBeyondLastLine: false,
          scrollbar: {
            alwaysConsumeMouseWheel: false,
          },
        }}
        theme="myTheme"
        editorDidMount={editorDidMount}
      />
    </div>
  );
};
