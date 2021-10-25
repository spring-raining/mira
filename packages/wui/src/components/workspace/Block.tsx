import { css, cx } from '@linaria/core';
import { styled } from '@linaria/react';
import { ServiceOptions } from '@mirajs/transpiler';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import {
  useBrick,
  useBrickManipulator,
  useInViewBrickState,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import { cssVar } from '../../theme';
import { Brick } from '../../types';
import { CodePreview } from '../CodePreview';
import { Editor, EditorLoaderConfig } from '../Editor';
import { PlusIcon, TrashIcon } from '../icon';
import { ErrorPreText } from '../styled/common';
import { LanguageCompletionForm } from './LanguageCompletionForm';
import {
  LiveProvider,
  LivedPreview,
  LivedError,
  useLivedComponent,
} from './LiveProvider';
import { MarkdownPreview } from './MarkdownProvider';

const visibilityHidden = css`
  visibility: hidden;
`;
const FlexCenter = styled.div`
  display: flex;
  align-items: center;
`;
const IconButton = styled.button`
  display: inline-block;
  appearance: none;
  justify-content: center;
  align-items: center;
  user-select: none;
  outline: none;
  cursor: pointer;
  background: transparent;
  border-width: 0;
  border-radius: ${cssVar('radii.md')};
  font-weight: ${cssVar('fontWeights.semibold')};
  height: ${cssVar('sizes.6')};
  min-width: ${cssVar('sizes.10')};
  font-size: ${cssVar('fontSizes.md')};
  color: inherit;
  &:focus {
    box-shadow: ${cssVar('shadows.outline')};
  }
`;
const AddIconButton = styled(IconButton)`
  &:hover {
    color: ${cssVar('colors.blue.500')};
  }
`;
const RemoveIconButton = styled(IconButton)`
  &:hover {
    color: ${cssVar('colors.red.500')};
  }
`;
const BlockContainer = styled.div`
  position: relative;
  margin: 2rem 0;
  pointer-events: none;
`;
const TopToolPart = styled.div`
  position: absolute;
  top: -2rem;
  left: -1.125rem;
  width: 50%;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;
`;
const MiddleToolContainer = styled.div<{ active?: boolean }>`
  position: relative;
  width: 100%;
  margin: 2rem 0;
  display: flex;
  border-left: ${(props) =>
    props.active
      ? `4px dashed ${cssVar('colors.gray.200')}`
      : '4px solid transparent'};
`;
const EditorStickyArea = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
`;
const EditorPart = styled.div`
  width: 50%;
  position: sticky;
  top: 0;
  pointer-events: auto;
`;
const LanguageCompletionContainer = styled.div<{ active?: boolean }>`
  position: absolute;
  top: -2rem;
  left: 0;
  width: 12rem;
  border-radius: 4px 4px 0 0;
  background-color: ${(props) =>
    props.active ? cssVar('colors.gray.100') : cssVar('colors.gray.50')};
`;
const EditorContainer = styled.div<{ active?: boolean }>`
  position: absolute;
  top: 0;
  left: 1rem;
  right: 1rem;
  border-radius: 0 4px 4px 4px;
  background-color: ${(props) =>
    props.active ? cssVar('colors.gray.100') : cssVar('colors.gray.50')};
`;
const LivePreviewStickyArea = styled.div`
  position: relative;
  width: 100%;
  margin: -2rem 0;
  padding: 2rem 0;
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  background-color: ${cssVar('colors.gray.50')};
`;
const LivePreviewPart = styled.div`
  width: 100%;
  padding-left: 1.5rem;
  position: sticky;
  top: 0;
  pointer-events: auto;
`;
const LivePreviewContainer = styled.div`
  width: 100%;
  padding: 1rem;
  border: 2px solid inherit;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: ${cssVar('colors.white')};
`;
const PreviewPart = styled.div`
  position: relative;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  pointer-events: auto;
`;
const ScriptPreviewContainer = styled.div`
  width: 100%;
  margin: 0 1rem;
  padding-left: 1.5rem;
`;
const ScriptPreviewCode = styled.code`
  * {
    font-family: ${cssVar('fonts.mono')};
    font-size: 12px;
    line-height: 1;
  }
  div {
    height: 18px;
  }
`;
const MarkdownPreviewContainer = styled.div`
  width: 100%;
  margin: -0.5rem 2.5rem;
  min-height: 4rem;
  padding-right: 2rem;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
`;
const MarkdownPreviewNoContentParagraph = styled.p`
  color: ${cssVar('colors.gray.400')};
`;
const BottomToolPart = styled.div`
  position: absolute;
  bottom: -2rem;
  left: -1.125rem;
  width: 50%;
  height: 2rem;
  display: flex;
  align-items: center;
  pointer-events: auto;
`;
const MiddleToolHandle = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: -1.125rem;
  width: 2rem;
  pointer-events: auto;
`;
const BlockToolBar = styled.div`
  position: absolute;
  top: -2.75rem;
  left: 1rem;
  width: 18rem;
  height: 2.25rem;
  padding: 0 0.75rem 0 1.125rem;
  border-radius: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${cssVar('colors.white')};
  box-shadow: ${cssVar('shadows.md')};
  pointer-events: auto;
`;

export const BlockComponent: React.FC<{
  brickId: string;
  language: string;
  noteType: Brick['noteType'];
  isLived?: boolean;
  editorLoaderConfig?: EditorLoaderConfig;
}> = ({
  brickId,
  language: initialLanguage,
  noteType,
  isLived,
  editorLoaderConfig,
}) => {
  const {
    brick,
    isActive,
    isFocused,
    updateBrick,
    updateLanguage,
    setActive,
    setFocused,
    importError,
  } = useBrick(brickId);
  const { insertBrick, cleanup } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId });
  const live = useLivedComponent();

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

  const containerCallbacks = {
    onMouseOver: useCallback(() => setFocused(true), [setFocused]),
    onMouseOut: useCallback(() => setFocused(false), [setFocused]),
    onClick: useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []),
  };

  const [editorText, setEditorText] = useState(() => brick.text);
  const onEditorChange = useCallback(
    (text: string) => {
      setEditorText(text);
      updateBrick(text);
      if (live && isLived) {
        live.onChange(text);
      }
    },
    [updateBrick, live, isLived]
  );
  // useEffect(() => {
  //   if (!isActive && brick.text !== editorText) {
  //     updateBrick(editorText);
  //   }
  // }, [isActive, brick.text, editorText, updateBrick]);

  const [editorHeight, setEditorHeight] = useState(0);
  const onContentHeightChange = useCallback((height) => {
    setEditorHeight(height);
  }, []);

  const [observerRef, inView] = useInView({ threshold: 0 });
  const { updateInViewState } = useInViewBrickState();
  useEffect(() => {
    updateInViewState(brickId, inView);
  }, [brickId, inView, updateInViewState]);

  return (
    <BlockContainer ref={observerRef} {...containerCallbacks}>
      <TopToolPart className={cx(!isFocused && !isActive && visibilityHidden)}>
        <FlexCenter>
          <AddIconButton aria-label="Prepend" onClick={prependBrick}>
            <PlusIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </AddIconButton>
        </FlexCenter>
      </TopToolPart>
      <MiddleToolContainer
        active={isFocused || isActive}
        style={{ minHeight: editorHeight }}
      >
        <PreviewPart
          className={cx(isActive && visibilityHidden)}
          onClick={setActive}
        >
          {noteType === 'script' && (
            <ScriptPreviewContainer>
              <pre>
                <ScriptPreviewCode>
                  <CodePreview code={brick.text} language="jsx" />
                </ScriptPreviewCode>
              </pre>
            </ScriptPreviewContainer>
          )}
          {language === 'markdown' && (
            <MarkdownPreviewContainer>
              <MarkdownPreview md={brick.text} />
              {!brick.text.trim() && (
                <MarkdownPreviewNoContentParagraph>
                  No content
                </MarkdownPreviewNoContentParagraph>
              )}
            </MarkdownPreviewContainer>
          )}
        </PreviewPart>
        <LivePreviewStickyArea>
          {isLived && (
            <LivePreviewPart>
              <LivePreviewContainer>
                <LivedPreview />
                <LivedError />
              </LivePreviewContainer>
            </LivePreviewPart>
          )}
          {noteType === 'script' && importError && (
            <LivePreviewPart>
              <LivePreviewContainer>
                <ErrorPreText>{String(importError)}</ErrorPreText>
              </LivePreviewContainer>
            </LivePreviewPart>
          )}
        </LivePreviewStickyArea>
        <EditorStickyArea>
          <EditorPart
            style={{ height: editorHeight }}
            className={cx(
              (language === 'markdown' || noteType === 'script') &&
                !isActive &&
                visibilityHidden
            )}
          >
            {/* <LanguageCompletionContainer
              active={isActive}
              className={cx(!isActive && !isFocused && visibilityHidden)}
            >
              <LanguageCompletionForm
                language={language}
                onUpdate={handleSubmitLanguage}
                onFocus={setActive}
              />
            </LanguageCompletionContainer> */}
            <EditorContainer active={isActive}>
              <Editor
                language={editorLanguage}
                onChange={onEditorChange}
                padding={{ top: 16, bottom: 16 }}
                {...{ editorLoaderConfig, onContentHeightChange }}
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
            </EditorContainer>
          </EditorPart>
        </EditorStickyArea>
        {isActive && (
          <BlockToolBar>
            <LanguageCompletionForm
              language={language}
              onUpdate={handleSubmitLanguage}
              onFocus={setActive}
            />
            <FlexCenter>
              <RemoveIconButton aria-label="Delete" onClick={deleteBrick}>
                <TrashIcon
                  className={css`
                    height: 1.5rem;
                  `}
                />
              </RemoveIconButton>
            </FlexCenter>
          </BlockToolBar>
        )}
        <MiddleToolHandle />
      </MiddleToolContainer>
      <BottomToolPart
        className={cx(!isFocused && !isActive && visibilityHidden)}
      >
        <FlexCenter>
          <AddIconButton aria-label="Append" onClick={appendBrick}>
            <PlusIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </AddIconButton>
        </FlexCenter>
      </BottomToolPart>
    </BlockContainer>
  );
};

export const Block: React.VFC<
  Pick<Brick, 'brickId'> & {
    transpilerConfig?: ServiceOptions;
    editorLoaderConfig?: EditorLoaderConfig;
  }
> = ({ brickId, transpilerConfig, editorLoaderConfig }) => {
  const { brick } = useBrick(brickId);

  if (brick.noteType === 'script') {
    return <BlockComponent {...brick} language="jsx" />;
  }
  if (brick.mira?.isLived) {
    return (
      <LiveProvider
        mira={brick.mira}
        code={brick.text}
        {...{ transpilerConfig }}
      >
        <BlockComponent
          {...{
            brickId,
            language: brick.language,
            noteType: brick.noteType,
            editorLoaderConfig,
          }}
          isLived
        />
      </LiveProvider>
    );
  } else {
    return (
      <BlockComponent
        {...{
          brickId,
          language: brick.language,
          noteType: brick.noteType,
          editorLoaderConfig,
        }}
      />
    );
  }
};
