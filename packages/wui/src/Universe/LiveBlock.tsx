import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { AsteroidBrick } from '../atoms';
import { useBrick, useBrickManipulator, createNewBrick } from '../hooks/brick';
import { useEditorCallbacks } from '../hooks/editor';
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
  return live?.output.element ? <>{live.output.element}</> : null;
};

const LivedError: React.FC = () => {
  const live = useLivedComponent();
  return live?.output.error ? (
    <div>
      <pre>{live.output.error.toString()}</pre>
    </div>
  ) : null;
};

export const LiveBlock: React.VFC<
  Pick<AsteroidBrick, 'asteroid' | 'brickId'>
> = ({ asteroid, brickId }) => {
  const { brick, updateBrick, insertBrick, isActive } = useBrick(brickId);
  const { cleanup } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId });
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
  const deleteBrick = useCallback(() => {
    cleanup(brickId);
  }, [cleanup, brickId]);

  if (brick.noteType !== 'asteroid') {
    return null;
  }
  return (
    <LiveProvider code={brick.text} {...{ asteroid }}>
      <div>
        <button onClick={prependBrick}>Add</button>
        <button onClick={deleteBrick}>Delete </button>
        <div
          className={css`
            display: flex;
            align-items: flex-start;
            width: 100%;
          `}
        >
          <div
            className={css`
              width: 50%;
              margin: 1rem;
              padding-right: 1rem;
              border-radius: 4px;
            `}
            style={{
              backgroundColor: isActive ? '#f4f4f5' : '#fafafa',
            }}
          >
            <LivedEditor onChange={onEditorChange} {...editorCallbacks} />
          </div>
          <div
            className={css`
              width: 50%;
              margin: 1rem;
              padding: 1rem;
              border: 2px solid #f4f4f5;
              border-radius: 4px;
              box-sizing: border-box;
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
