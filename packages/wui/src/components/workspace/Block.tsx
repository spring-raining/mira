import clsx from 'clsx';
import { css } from 'lightwindcss';
import React, { useCallback, useState, useMemo } from 'react';
import {
  useBrick,
  useBrickManipulator,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import { Brick } from '../../types';
import { Editor } from '../Editor';
import { PlusIcon, XIcon } from '../icon';
import { LanguageCompletionForm } from './LanguageCompletionForm';
import {
  LiveProvider,
  LivedPreview,
  LivedError,
  useLivedComponent,
} from './LiveProvider';
import { MarkdownPreview } from './MarkdownProvider';

const useStyle = () => {
  const iconButtonStyle = css`
    display: inline-block;
    appearance: none;
    justify-content: center;
    align-items: center;
    user-select: none;
    outline: none;
    cursor: pointer;
    background: transparent;
    border-width: 0;
    border-radius: var(--astr-radii-md);
    font-weight: var(--astr-fontWeights-semibold);
    height: var(--astr-sizes-6);
    min-width: var(--astr-sizes-10);
    font-size: var(--astr-fontSizes-md);
    color: inherit;
    &:focus {
      box-shadow: var(--astr-shadows-outline);
    }
  `;
  return { iconButtonStyle };
};

export const BlockComponent: React.FC<{
  brickId: string;
  language: string;
  isLived?: boolean;
}> = ({ brickId, language: initialLanguage, isLived }) => {
  const {
    brick,
    isActive,
    updateBrick,
    updateLanguage,
    focus: focusBrick,
  } = useBrick(brickId);
  const { insertBrick, cleanup } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId });
  const live = useLivedComponent();
  const { iconButtonStyle } = useStyle();

  const [language, setLanguage] = useState(() => initialLanguage);
  const handleSubmitLanguage = useCallback(
    (lang: string) => {
      setLanguage(lang);
      updateLanguage(lang);
    },
    [updateLanguage]
  );
  const editorLanguage = useMemo(
    () => language.toLowerCase().split(/[^\w-]/)[0],
    [language]
  );

  const onEditorChange = useCallback(
    (text: string) => {
      updateBrick(text);
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
    focusBrick();
  }, [focusBrick]);

  const [isFocus, setFocus] = useState(false);
  const containerCallbacks = {
    onMouseOver: useCallback(() => setFocus(true), []),
    onMouseOut: useCallback(() => setFocus(false), []),
  };

  return (
    <div
      className={css`
        position: relative;
        margin: 2rem 0;
      `}
      {...containerCallbacks}
    >
      <div
        className={clsx(
          css`
            position: absolute;
            top: -2rem;
            left: -1.375rem;
            width: 50%;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
          `,
          !isFocus &&
            !isActive &&
            css`
              visibility: hidden;
            `
        )}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
          `}
        >
          <button
            className={clsx(
              iconButtonStyle,
              css`
                &:hover {
                  color: var(--astr-colors-blue-500);
                }
              `
            )}
            aria-label="Prepend"
            onClick={prependBrick}
          >
            <PlusIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </button>
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
          `}
        >
          <button
            className={clsx(
              iconButtonStyle,
              css`
                &:hover {
                  color: var(--astr-colors-red-500);
                }
              `
            )}
            aria-label="Delete"
            onClick={deleteBrick}
          >
            <XIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </button>
        </div>
      </div>
      <div
        className={clsx(
          css`
            width: 100%;
            margin: 2rem 0;
            margin-left: -5px;
            padding-left: 5px;
          `,
          (isFocus || isActive) &&
            css`
              padding-left: 0;
              border-left: 5px dotted var(--astr-colors-gray-400);
            `
        )}
      >
        {language === 'markdown' && (
          <div
            className={clsx(
              css`
                display: flex;
                justify-content: start;
                align-items: flex-start;
                width: 100%;
              `
            )}
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
                    color: var(--astr-colors-gray-400);
                  `}
                >
                  No content
                </p>
              )}
            </div>
          </div>
        )}
        <div
          className={clsx(
            css`
              display: flex;
              justify-content: start;
              align-items: flex-start;
              width: 100%;
            `
          )}
          style={{
            ...(language === 'markdown' &&
              !isActive && {
                pointerEvents: 'none',
                opacity: 0,
                position: 'absolute',
                width: 0,
              }),
          }}
        >
          <div
            className={css`
              width: 50%;
              margin: 0 1rem;
            `}
          >
            <div
              className={clsx(
                css`
                  position: relative;
                  max-width: 12rem;
                  border-radius: 4px 4px 0 0;
                  background-color: var(--astr-colors-gray-50);
                `,
                isActive &&
                  css`
                    background-color: var(--astr-colors-gray-100);
                  `
              )}
            >
              <LanguageCompletionForm
                language={language}
                onUpdate={handleSubmitLanguage}
                onFocus={focusBrick}
              />
            </div>
            <div
              className={clsx(
                css`
                  position: relative;
                  padding-right: 1rem;
                  border-radius: 0 0 4px 4px;
                  background-color: var(--astr-colors-gray-50);
                `,
                isActive &&
                  css`
                    background-color: var(--astr-colors-gray-100);
                  `
              )}
            >
              <Editor
                language={editorLanguage}
                onChange={onEditorChange}
                padding={{ top: 12, bottom: 24 }}
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
                  border: 2px solid var(--astr-colors-gray-50);
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
      <div
        className={clsx(
          css`
            position: absolute;
            bottom: -2rem;
            left: -1.375rem;
            width: 50%;
            height: 2rem;
            display: flex;
            align-items: center;
          `,
          !isFocus &&
            !isActive &&
            css`
              visibility: hidden;
            `
        )}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
          `}
        >
          <button
            className={clsx(
              iconButtonStyle,
              css`
                &:hover {
                  color: var(--astr-colors-blue-500);
                }
              `
            )}
            aria-label="Append"
            onClick={appendBrick}
          >
            <PlusIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </button>
        </div>
      </div>
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
