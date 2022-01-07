import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useInView } from 'react-intersection-observer';
import clsx from 'clsx';
import { useInViewBrickState } from '../../hooks/useInViewState';
import {
  useBrick,
  useBrickManipulator,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import { useRenderedData } from '../../state/evaluator';
import { Mira, Brick } from '../../types';
import { CodePreview } from '../CodePreview';
import { Editor, EditorLoaderConfig } from '../Editor';
import { PlusIcon, TrashIcon } from '../icon';
import { PopperPortal } from '../PopperPortal';
import { BlockTypeSelect } from './BlockTypeSelect';
import { LanguageCompletionForm } from './LanguageCompletionForm';
import { MarkdownPreview } from './MarkdownProvider';
import { errorPreText, iconSvg } from '../../styles/common.css';
import { sprinkles } from '../../styles/sprinkles.css';
import * as style from './Block.css';

const EvalPresentation: React.VFC<{ brickId: string; mira: Mira }> = ({
  brickId,
  mira,
}) => {
  const settledOutput = useRef<ReturnType<typeof useRenderedData>['output']>();
  const { output } = useRenderedData(mira.id);

  useEffect(() => {
    if (output) {
      settledOutput.current = output;
    }
  }, [output]);
  useEffect(() => {
    settledOutput.current = undefined;
  }, [brickId]);
  // Show previous output to avoid a FOIC
  const currentOutput = output ?? settledOutput.current;
  return (
    <>
      {currentOutput?.error ? (
        <div>
          <pre className={errorPreText}>{currentOutput.error.toString()}</pre>
        </div>
      ) : (
        currentOutput?.element
      )}
    </>
  );
};

const BlockToolbar: React.VFC<{
  id: string;
}> = ({ id }) => {
  const { brick, updateTrait, setActive } = useBrick(id);
  const { cleanup } = useBrickManipulator();
  const [brickType, setBrickType] = useState(() => brick.type);
  const deleteBrick = useCallback(() => {
    cleanup(id);
  }, [cleanup, id]);
  const handleChangeBlockType = useCallback(
    (type: Brick['type']) => {
      updateTrait({ type });
    },
    [updateTrait]
  );
  const handleChangeEditingLanguage = useCallback(
    (lang: string) => {
      setBrickType(
        lang.trim() ? 'snippet' : brick.type === 'script' ? 'script' : 'note'
      );
    },
    [brick.type]
  );
  const handleChangeLanguage = useCallback(
    (language: string) => {
      updateTrait({ language, type: brickType });
    },
    [brickType, updateTrait]
  );

  return (
    <div className={style.toolbar}>
      <BlockTypeSelect value={brickType} onChange={handleChangeBlockType} />
      <LanguageCompletionForm
        language={brick.type === 'snippet' ? brick.language : ''}
        onChange={handleChangeEditingLanguage}
        onSubmit={handleChangeLanguage}
        onFocus={setActive}
      />
      <div className={sprinkles({ display: 'flex', alignItems: 'center' })}>
        <button
          className={style.iconButton({ colorScheme: 'red' })}
          aria-label="Delete"
          onClick={deleteBrick}
        >
          <TrashIcon className={iconSvg} />
        </button>
      </div>
    </div>
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
    swap,
    isActive,
    isFocused,
    setActive,
    setFocused,
  } = useBrick(id);
  const { insertBrick } = useBrickManipulator();
  const editorCallbacks = useEditorCallbacks({ brickId: id });

  const editorLanguage = useMemo(() => {
    const language =
      brick.type === 'snippet'
        ? brick.language
        : brick.type === 'note'
        ? 'markdown'
        : brick.type === 'script'
        ? 'jsx'
        : '';
    return language.toLowerCase().split(/[^\w-]/)[0];
  }, [brick]);
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
    <div className={style.blockContainer} {...containerCallbacks}>
      <div
        className={clsx(
          style.topToolPart,
          !isFocused && !isActive && sprinkles({ visibility: 'hidden' })
        )}
      >
        <div className={sprinkles({ display: 'flex', alignItems: 'center' })}>
          <button
            className={style.iconButton({ colorScheme: 'blue' })}
            aria-label="Prepend"
            onClick={prependBrick}
          >
            <PlusIcon className={iconSvg} />
          </button>
          {isActive && (
            <div className={style.toolbarHolder}>
              <PopperPortal
                popperOptions={{
                  placement: 'bottom-start',
                }}
              >
                <BlockToolbar id={id} />
              </PopperPortal>
            </div>
          )}
        </div>
      </div>
      <div
        className={style.middleToolContainer({
          isActive: isFocused || isActive,
        })}
        ref={observerRef}
        style={{ minHeight: editorHeight }}
      >
        <div
          className={clsx(
            style.previewPart,
            isActive && sprinkles({ visibility: 'hidden' })
          )}
          onClick={setActive}
        >
          {brick.type === 'script' && (
            <div className={style.scriptPreviewContainer}>
              {brick.text.trim() ? (
                <pre>
                  <code className={style.scriptPreviewCode}>
                    <CodePreview
                      code={syntaxError?.parsedText || brick.text}
                      language="jsx"
                    />
                  </code>
                </pre>
              ) : (
                <p>No content</p>
              )}
            </div>
          )}
          {brick.type === 'note' && (
            <div className={style.markdownPreviewContainer}>
              {syntaxError?.parsedText ? (
                <pre>
                  <code className={style.scriptPreviewCode}>
                    {syntaxError.parsedText}
                  </code>
                </pre>
              ) : brick.text.trim() ? (
                <MarkdownPreview md={brick.text} />
              ) : (
                <p className={style.noContentParagraph}>No content</p>
              )}
            </div>
          )}
        </div>
        <div className={style.livePreviewStickyArea}>
          {brick.type === 'snippet' && brick.mira?.isLived && (
            <div className={style.livePreviewPart}>
              <div className={style.livePreviewContainer}>
                <React.Suspense fallback={null}>
                  <EvalPresentation
                    brickId={id}
                    mira={swap?.mira || brick.mira}
                  />
                </React.Suspense>
              </div>
            </div>
          )}
          {displayingError && (
            <div className={style.livePreviewPart}>
              <div className={style.livePreviewContainer}>
                <pre className={errorPreText}>{String(displayingError)}</pre>
              </div>
            </div>
          )}
        </div>
        <div className={style.editorStickyArea}>
          <div
            className={clsx(
              style.editorPart,
              (brick.type === 'note' || brick.type === 'script') &&
                !isActive &&
                sprinkles({ visibility: 'hidden' })
            )}
            style={{ height: editorHeight }}
          >
            <div className={style.editorContainer({ isActive })}>
              <Editor
                language={editorLanguage}
                padding={{ top: 16, bottom: 16 }}
                code={brick.text}
                {...{ editorLoaderConfig, onContentHeightChange }}
                {...editorCallbacks}
              />
            </div>
          </div>
        </div>
        <div />
      </div>
      <div
        className={clsx(
          style.bottomToolPart,
          !isFocused &&
            !isActive &&
            sprinkles({
              visibility: 'hidden',
            })
        )}
      >
        <div className={sprinkles({ display: 'flex', alignItems: 'center' })}>
          <button
            className={style.iconButton({ colorScheme: 'blue' })}
            aria-label="Append"
            onClick={appendBrick}
          >
            <PlusIcon className={iconSvg} />
          </button>
        </div>
      </div>
    </div>
  );
};
