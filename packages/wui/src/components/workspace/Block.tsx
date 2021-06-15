import { css, cx } from '@linaria/core';
import { styled } from '@linaria/react';
import { ServiceOptions } from '@mirajs/transpiler';
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  useBrick,
  useBrickManipulator,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import { cssVar } from '../../theme';
import { Brick } from '../../types';
import { CodePreview } from '../CodePreview';
import { Editor, EditorLoaderConfig } from '../Editor';
import { PlusIcon, XIcon } from '../icon';
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
  margin: 3rem 0;
  pointer-events: none;
`;
const TopToolPart = styled.div`
  position: absolute;
  top: -3rem;
  left: -1.125rem;
  width: 50%;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: auto;
`;
const MiddleToolContainer = styled.div<{ active?: boolean }>`
  position: relative;
  width: 100%;
  margin: 3rem 0;
  display: flex;
  border-left: ${(props) =>
    props.active
      ? `5px dotted ${cssVar('colors.gray.400')}`
      : '5px solid transparent'};
`;
const EditorStickyArea = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1rem;
  right: 1rem;
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
  left: 0;
  right: 0;
  border-radius: 0 4px 4px 4px;
  background-color: ${(props) =>
    props.active ? cssVar('colors.gray.100') : cssVar('colors.gray.50')};
`;
const LivePreviewStickyArea = styled.div`
  position: relative;
  width: 100%;
  align-self: stretch;
  padding: 0 1rem;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
`;
const LivePreviewPart = styled.div`
  width: 50%;
  padding-left: 1.5rem;
  position: sticky;
  top: 0;
  pointer-events: auto;
`;
const LivePreviewContainer = styled.div`
  width: 100%;
  padding: 1rem;
  border: 2px solid ${cssVar('colors.gray.50')};
  border-radius: 4px;
  box-sizing: border-box;
`;
const ScriptPreviewPart = styled.div`
  position: absolute;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  pointer-events: auto;
`;
const ScriptPreviewContainer = styled.div`
  width: 50%;
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
const MarkdownPreviewPart = styled.div`
  position: relative;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  pointer-events: auto;
`;
const MarkdownPreviewContainer = styled.div`
  width: 50%;
  margin: -1rem 2.5rem 0 2.5rem;
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
  bottom: -3rem;
  left: -1.125rem;
  width: 50%;
  height: 3rem;
  display: flex;
  align-items: center;
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
    updateBrick,
    updateLanguage,
    setActive,
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

  const [isFocus, setFocus] = useState(false);
  const containerCallbacks = {
    onMouseOver: useCallback(() => setFocus(true), []),
    onMouseOut: useCallback(() => setFocus(false), []),
    onClick: useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []),
  };

  const [editorText, setEditorText] = useState(() => brick.text);
  const onEditorChange = useCallback(
    (text: string) => {
      setEditorText(text);
      if (live && isLived) {
        updateBrick(text);
        live.onChange(text);
      }
    },
    [updateBrick, live, isLived]
  );
  useEffect(() => {
    if (!isActive && brick.text !== editorText) {
      updateBrick(editorText);
    }
  }, [isActive, brick.text, editorText, updateBrick]);

  const [editorHeight, setEditorHeight] = useState(0);
  const onContentHeightChange = useCallback((height) => {
    setEditorHeight(height);
  }, []);

  return (
    <BlockContainer {...containerCallbacks}>
      <TopToolPart className={cx(!isFocus && !isActive && visibilityHidden)}>
        <FlexCenter>
          <AddIconButton aria-label="Prepend" onClick={prependBrick}>
            <PlusIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </AddIconButton>
        </FlexCenter>
        <FlexCenter>
          <RemoveIconButton aria-label="Delete" onClick={deleteBrick}>
            <XIcon
              className={css`
                height: 1.5rem;
              `}
            />
          </RemoveIconButton>
        </FlexCenter>
      </TopToolPart>
      <MiddleToolContainer
        active={isFocus || isActive}
        style={{ minHeight: editorHeight }}
      >
        <EditorStickyArea>
          <EditorPart
            style={{ height: editorHeight }}
            className={cx(
              (language === 'markdown' || noteType === 'script') &&
                !isActive &&
                visibilityHidden
            )}
          >
            <LanguageCompletionContainer
              active={isActive}
              className={cx(!isActive && !isFocus && visibilityHidden)}
            >
              <LanguageCompletionForm
                language={language}
                onUpdate={handleSubmitLanguage}
                onFocus={setActive}
              />
            </LanguageCompletionContainer>
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
        {isLived && (
          <LivePreviewStickyArea>
            <LivePreviewPart>
              <LivePreviewContainer>
                <LivedPreview />
                <LivedError />
              </LivePreviewContainer>
            </LivePreviewPart>
          </LivePreviewStickyArea>
        )}
        {noteType === 'script' && (
          <ScriptPreviewPart
            className={cx(isActive && visibilityHidden)}
            onClick={setActive}
          >
            <ScriptPreviewContainer>
              <pre>
                <ScriptPreviewCode>
                  <CodePreview code={brick.text} language="jsx" />
                </ScriptPreviewCode>
              </pre>
            </ScriptPreviewContainer>
            {importError && (
              <LivePreviewPart>
                <LivePreviewContainer>
                  <ErrorPreText>{String(importError)}</ErrorPreText>
                </LivePreviewContainer>
              </LivePreviewPart>
            )}
          </ScriptPreviewPart>
        )}
        {language === 'markdown' && (
          <MarkdownPreviewPart
            className={cx(isActive && visibilityHidden)}
            onClick={setActive}
          >
            <MarkdownPreviewContainer>
              <MarkdownPreview md={brick.text} />
              {!brick.text.trim() && (
                <MarkdownPreviewNoContentParagraph>
                  No content
                </MarkdownPreviewNoContentParagraph>
              )}
            </MarkdownPreviewContainer>
          </MarkdownPreviewPart>
        )}
      </MiddleToolContainer>
      <BottomToolPart className={cx(!isFocus && !isActive && visibilityHidden)}>
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
