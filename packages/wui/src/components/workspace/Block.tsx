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
import { useRenderedData } from '../../state/evaluator';
import { cssVar } from '../../theme';
import { Brick } from '../../types';
import { CodePreview } from '../CodePreview';
import { Editor, EditorLoaderConfig } from '../Editor';
import { PlusIcon, TrashIcon } from '../icon';
import { PopperPortal } from '../PopperPortal';
import { ErrorPreText } from '../styled/common';
import { BlockTypeSelect } from './BlockTypeSelect';
import { LanguageCompletionForm } from './LanguageCompletionForm';
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
  /* Align with Editor size */
  padding-left: 26px;
  pre {
    margin: 16px 0;
  }
`;
const ScriptPreviewCode = styled.code`
  * {
    font-family: ${cssVar('fonts.mono')};
    font-size: 12px;
    line-height: 18px;
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
const NoContentParagraph = styled.p`
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
const BlockToolBarHolder = styled.div`
  position: relative;
  top: -1.75rem;
`;
const BlockToolBar = styled.div`
  width: 18rem;
  height: 2.25rem;
  padding: 0 0.75rem 0 0.25rem;
  border-radius: 1.125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: ${cssVar('colors.white')};
  box-shadow: ${cssVar('shadows.md')};
  pointer-events: auto;
`;

const EvalPresentation: React.VFC<{ brickId: string }> = ({ brickId }) => {
  const { output } = useRenderedData(brickId);
  return (
    <>
      {output?.error ? (
        <div>
          <ErrorPreText>{output.error.toString()}</ErrorPreText>
        </div>
      ) : (
        output?.element
      )}
    </>
  );
};

export const Block: React.FC<{
  id: string;
  editorLoaderConfig?: EditorLoaderConfig;
}> = ({ id, editorLoaderConfig }) => {
  const {
    brick,
    syntaxError,
    moduleImportError,
    isActive,
    isFocused,
    updateLanguage,
    setActive,
    setFocused,
  } = useBrick(id);
  const { insertBrick, cleanup } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId: id });

  const [language, setLanguage] = useState(() =>
    brick.type === 'snippet'
      ? brick.language
      : brick.type === 'note'
      ? 'markdown'
      : brick.type === 'script'
      ? 'jsx'
      : ''
  );
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
      newBrick: createNewBrick({
        type: 'snippet',
        language: 'jsx',
        isLived: true,
      }),
      targetBrickId: id,
      offset: 0,
    });
  }, [insertBrick, id]);
  const appendBrick = useCallback(() => {
    insertBrick({
      newBrick: createNewBrick({
        type: 'snippet',
        language: 'jsx',
        isLived: true,
      }),
      targetBrickId: id,
      offset: 1,
    });
  }, [insertBrick, id]);
  const deleteBrick = useCallback(() => {
    cleanup(id);
  }, [cleanup, id]);

  const containerCallbacks = {
    onMouseOver: useCallback(() => setFocused(true), [setFocused]),
    onMouseOut: useCallback(() => setFocused(false), [setFocused]),
    onClick: useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []),
  };

  const [editorHeight, setEditorHeight] = useState(0);
  const onContentHeightChange = useCallback((height) => {
    setEditorHeight(height);
  }, []);

  const [observerRef, inView] = useInView({ threshold: 0 });
  const { updateInViewState } = useInViewBrickState();
  useEffect(() => {
    updateInViewState(id, inView);
  }, [id, inView, updateInViewState]);
  const displayingError = syntaxError?.error || moduleImportError;

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
          {isActive && (
            <BlockToolBarHolder>
              <PopperPortal
                popperOptions={{
                  placement: 'bottom-start',
                }}
              >
                <BlockToolBar>
                  <BlockTypeSelect value={brick.type} />
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
              </PopperPortal>
            </BlockToolBarHolder>
          )}
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
          {brick.type === 'script' && (
            <ScriptPreviewContainer>
              {brick.text.trim() ? (
                <pre>
                  <ScriptPreviewCode>
                    <CodePreview
                      code={syntaxError?.parsedText || brick.text}
                      language="jsx"
                    />
                  </ScriptPreviewCode>
                </pre>
              ) : (
                <NoContentParagraph>No content</NoContentParagraph>
              )}
            </ScriptPreviewContainer>
          )}
          {brick.type === 'note' && (
            <MarkdownPreviewContainer>
              {syntaxError?.parsedText ? (
                <pre>
                  <ScriptPreviewCode>
                    {syntaxError.parsedText}
                  </ScriptPreviewCode>
                </pre>
              ) : brick.text.trim() ? (
                <MarkdownPreview md={brick.text} />
              ) : (
                <NoContentParagraph>No content</NoContentParagraph>
              )}
            </MarkdownPreviewContainer>
          )}
        </PreviewPart>
        <LivePreviewStickyArea>
          {brick.type === 'snippet' && brick.mira?.isLived && (
            <LivePreviewPart>
              <LivePreviewContainer>
                <React.Suspense fallback={null}>
                  <EvalPresentation brickId={id} />
                </React.Suspense>
              </LivePreviewContainer>
            </LivePreviewPart>
          )}
          {displayingError && (
            <LivePreviewPart>
              <LivePreviewContainer>
                <ErrorPreText>{String(displayingError)}</ErrorPreText>
              </LivePreviewContainer>
            </LivePreviewPart>
          )}
        </LivePreviewStickyArea>
        <EditorStickyArea>
          <EditorPart
            style={{ height: editorHeight }}
            className={cx(
              (brick.type === 'note' || brick.type === 'script') &&
                !isActive &&
                visibilityHidden
            )}
          >
            <EditorContainer active={isActive}>
              <Editor
                language={editorLanguage}
                padding={{ top: 16, bottom: 16 }}
                code={brick.text}
                {...{ editorLoaderConfig, onContentHeightChange }}
                {...editorCallbacks}
              />
            </EditorContainer>
          </EditorPart>
        </EditorStickyArea>
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
