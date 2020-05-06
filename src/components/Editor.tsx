import React, { useState, useCallback, useEffect } from 'react';
import MonacoEditor, { EditorDidMount } from '@monaco-editor/react';

export const Editor: React.FC<{
  code?: string;
  language?: string;
  onChange?: (code: string) => void;
}> = ({ code, language, onChange = () => {} }) => {
  const lineHeight = 18;
  const [height, setHeight] = useState(0);
  const [currentValue, setCurrentValue] = useState(() => code);

  const [monaco, setMonaco] = useState(null);
  const editorDidMount: EditorDidMount = useCallback(
    (getEditorValue, monaco) => {
      setMonaco(monaco);
      monaco.onDidChangeModelContent(() => {
        const value = getEditorValue();
        setCurrentValue(value);
        onChange(value);
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (!monaco) {
      return;
    }
    // https://github.com/microsoft/monaco-editor/issues/794
    let prevHeight = 0;
    const updateEditorHeight = (monaco: any) => {
      const el = monaco.getDomNode();
      if (!el) {
        return;
      }
      const lineCount = monaco.getModel()?.getLineCount() || 1;
      const height = monaco.getTopForLineNumber(lineCount + 5) + lineHeight;
      if (prevHeight !== height) {
        prevHeight = height;
        requestAnimationFrame(() => {
          el.style.height = `${height}px`;
          setHeight(height);
          monaco.layout();
        });
      }
    };
    updateEditorHeight(monaco);
    monaco.onDidChangeModelDecorations(() => {
      updateEditorHeight(monaco); // typing
      requestAnimationFrame(() => updateEditorHeight(monaco)); // folding
    });
  }, [monaco]);

  return (
    <div style={{ height }}>
      <MonacoEditor
        value={code}
        language={language}
        options={{
          minimap: { enabled: false },
          lineHeight,
          scrollBeyondLastLine: false,
        }}
        editorDidMount={editorDidMount}
      />
    </div>
  );
};
