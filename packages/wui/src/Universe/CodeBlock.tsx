import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { AsteroidBrick } from '../atoms';
import { useBrick, createNewBrick } from '../hooks/brick';
import { Editor, EditorProps } from '../Editor';
import { LiveProvider, useLivedComponent } from './LiveProvider';

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
  return live?.output.element ? <live.output.element /> : null;
};

const LivedError: React.FC = () => {
  const live = useLivedComponent();
  return live?.output.error ? (
    <div>
      <pre>{live.output.error.toString()}</pre>
    </div>
  ) : null;
};

export const CodeBlock: React.VFC<
  Pick<AsteroidBrick, 'asteroid' | 'brickId'>
> = ({ asteroid, brickId }) => {
  const { brick, updateBrick, insertBrick } = useBrick(brickId);
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
    <LiveProvider code={brick.text} {...{ asteroid }}>
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
