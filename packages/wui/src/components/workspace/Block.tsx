import { css } from 'lightwindcss';
import React, { useCallback, useState } from 'react';
import {
  useBrick,
  useBrickManipulator,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import { Brick } from '../../types';
import { Editor } from '../Editor';
import { LanguageCompletionForm } from './LanguageCompletionForm';
import {
  LiveProvider,
  LivedPreview,
  LivedError,
  useLivedComponent,
} from './LiveProvider';
import { MarkdownPreview } from './MarkdownProvider';

export const BlockComponent: React.FC<{
  brickId: string;
  language: string;
  isLived?: boolean;
}> = ({ brickId, language: initialLanguage, isLived }) => {
  const { brick, isActive, updateBrick, focus } = useBrick(brickId);
  const { insertBrick, cleanup } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId });
  const live = useLivedComponent();

  const [languageEditorActive, setLanguageEditorActive] = useState(false);
  const [language, setLanguage] = useState(() => initialLanguage);
  const languageCompletionHandlers = {
    onMount: useCallback(() => setLanguageEditorActive(false), []),
    onSubmit: useCallback((lang: string) => {
      setLanguage(lang);
      setLanguageEditorActive(false);
    }, []),
    onBlur: useCallback(() => setLanguageEditorActive(false), []),
  };

  const onEditorChange = useCallback(
    (text: string) => {
      updateBrick((brick) => ({ ...brick, text }));
      if (live && isLived) {
        live.onChange(text);
      }
    },
    [updateBrick, live, isLived]
  );
  const prependBrick = useCallback(() => {
    insertBrick({
      newBrick: createNewBrick({ language: 'jsx', isLived: true }),
      targetBrickId: brickId,
      offset: 0,
    });
  }, [insertBrick, brickId]);
  const appendBrick = useCallback(() => {
    insertBrick({
      newBrick: createNewBrick({ language: 'jsx', isLived: true }),
      targetBrickId: brickId,
      offset: 1,
    });
  }, [insertBrick, brickId]);
  const deleteBrick = useCallback(() => {
    cleanup(brickId);
  }, [cleanup, brickId]);

  const handleMarkdownAreaClick = useCallback(() => {
    focus();
  }, [focus]);

  return (
    <div>
      <button onClick={prependBrick}>Add</button>
      <button onClick={deleteBrick}>Delete </button>
      <div
        className={[
          css`
            width: 100%;
            margin: 2rem 0;
            margin-left: 5px;
            &:hover {
              border-left: 5px dotted #a0aec0;
              margin-left: 0;
            }
          `,
          isActive
            ? css`
                border-left: 5px dotted #a0aec0;
                margin-left: 0;
              `
            : css``,
        ].join(' ')}
      >
        {language === 'markdown' && (
          <div
            className={css`
              display: flex;
              justify-content: start;
              align-items: flex-start;
              width: 100%;
            `}
            style={{
              ...(isActive && {
                pointerEvents: 'none',
                opacity: 0,
                position: 'absolute',
              }),
            }}
            onClick={handleMarkdownAreaClick}
          >
            <div
              className={css`
                width: 50%;
                margin: 0 1.5rem;
                min-height: 4rem;
                padding-right: 2rem;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
              `}
            >
              <MarkdownPreview md={brick.text} />
              {!brick.text.trim() && (
                <p
                  className={css`
                    color: #a0aec0;
                  `}
                >
                  No content
                </p>
              )}
            </div>
          </div>
        )}
        <div
          className={css`
            display: flex;
            justify-content: start;
            align-items: flex-start;
            width: 100%;
          `}
          style={{
            ...(language === 'markdown' &&
              !isActive && {
                pointerEvents: 'none',
                opacity: 0,
                width: 0,
                position: 'absolute',
              }),
          }}
        >
          <div
            className={css`
              width: 50%;
              margin: 0 1rem;
              padding-right: 1rem;
              border-radius: 4px;
            `}
            style={{
              backgroundColor: isActive ? '#f4f4f5' : '#fafafa',
            }}
          >
            <div
              className={css`
                position: relative;
              `}
            >
              <div
                style={{
                  visibility: languageEditorActive ? 'initial' : 'hidden',
                }}
              >
                <LanguageCompletionForm {...languageCompletionHandlers} />
              </div>
              <div
                className={css`
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                `}
                style={{
                  visibility: languageEditorActive ? 'hidden' : 'initial',
                }}
                onClick={() => setLanguageEditorActive(true)}
              >
                {language}
              </div>
            </div>
            <Editor
              language={language.toLowerCase()}
              onChange={onEditorChange}
              {...editorCallbacks}
              {...(live && isLived
                ? {
                    code: live.code,
                    readOnly: !live.canEdit,
                    errorMarkers: live.errorMarkers,
                    warnMarkers: live.warnMarkers,
                  }
                : {
                    code: brick.text,
                  })}
            />
          </div>
          <div
            className={css`
              width: 50%;
              margin: 0 1rem;
            `}
          >
            {isLived && (
              <div
                className={css`
                  width: 100%;
                  padding: 1rem;
                  border: 2px solid #f4f4f5;
                  border-radius: 4px;
                  box-sizing: border-box;
                `}
              >
                <LivedPreview />
                <LivedError />
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={appendBrick}>Add</button>
    </div>
  );
};

export const Block: React.VFC<Pick<Brick, 'brickId'>> = ({ brickId }) => {
  const { brick } = useBrick(brickId);

  if (brick.noteType !== 'content') {
    return null;
  }
  if (brick.asteroid?.isLived) {
    return (
      <LiveProvider asteroid={brick.asteroid} code={brick.text}>
        <BlockComponent {...{ brickId, language: brick.language }} isLived />
      </LiveProvider>
    );
  } else {
    return <BlockComponent {...{ brickId, language: brick.language }} />;
  }
};
