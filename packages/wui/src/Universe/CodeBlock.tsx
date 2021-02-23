import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { useBrick, createNewBrick } from '../hooks/brick';
import { useProvidence } from '../hooks/providence';
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
      readOnly={!live.canEdit}
      errorMarkers={live.errorMarkers}
      warnMarkers={live.warnMarkers}
      onChange={handleChange}
    />
  );
};

const LivedPreview: React.FC = () => {
  const live = useLivedComponent();
  return live?.element ? <live.element /> : null;
};

const LivedError: React.FC = () => {
  const live = useLivedComponent();
  return live?.error ? (
    <div>
      <pre>{live.error}</pre>
    </div>
  ) : null;
};

export const CodeBlock: React.VFC<{ brickId: string }> = ({ brickId }) => {
  const { brick, updateBrick, insertBrick } = useBrick(brickId);
  const { evaluate } = useProvidence();
  const onEditorChange = useCallback(
    (text: string) => {
      updateBrick((brick) => ({ ...brick, text }));
    },
    [updateBrick]
  );
  const prependBrick = useCallback(() => {
    insertBrick(createNewBrick('asteroid'), 0);
  }, [insertBrick]);
  const appendBrick = useCallback(() => {
    insertBrick(createNewBrick('asteroid'), 1);
  }, [insertBrick]);

  if (brick.noteType !== 'asteroid') {
    return null;
  }
  return (
    <LiveProvider code={brick.text} onEvaluate={evaluate}>
      <div>
        <button onClick={prependBrick}>Add</button>
        <div
          className={css`
            display: flex;
            width: 100%;
            margin: 1rem 0;
            padding: 1rem 0;
            background-color: beige;
          `}
        >
          <div
            className={css`
              width: 50%;
            `}
          >
            <LivedEditor onChange={onEditorChange} />
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
        <button onClick={appendBrick}>Add</button>
      </div>
    </LiveProvider>
  );
};
