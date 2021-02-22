import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { Editor, EditorProps } from '../Editor';
import { LiveProvider, useLivedComponent } from './live';

const LivedEditor: React.FC<Omit<EditorProps, 'code' | 'language'>> = ({
  onChange,
  ...other
}) => {
  const live = useLivedComponent();
  const handleChange = useCallback(
    (text) => {
      onChange?.(text);
      live?.onChange(text);
    },
    [live, onChange]
  );
  if (!live) {
    return null;
  }
  return (
    <Editor
      {...other}
      code={live.code}
      language="javascript"
      onChange={handleChange}
    />
  );
};

const LivedPreview: React.FC = () => {
  const live = useLivedComponent();
  return live?.element ? <>{live.element}</> : null;
};

const LivedError: React.FC = () => {
  const live = useLivedComponent();
  return live?.error ? (
    <div>
      <pre>{live.error}</pre>
    </div>
  ) : null;
};

export const CodeBlock: React.FC = () => {
  return (
    <LiveProvider>
      <div
        className={css`
          display: flex;
          width: 100%;
        `}
      >
        <div
          className={css`
            width: 50%;
          `}
        >
          <LivedEditor />
        </div>
        <div
          className={css`
            width: 50%;
          `}
        >
          <LivedPreview />
          <LivedError />
        </div>
      </div>
    </LiveProvider>
  );
};
