import clsx from 'clsx';
import React, {
  useCallback,
  useState,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { useInView } from 'react-intersection-observer';
import { useInViewBrickState } from '../../hooks/useInViewState';
import { useRootContainerQuery } from '../../hooks/useRootContainerQuery';
import {
  useBrick,
  useBrickManipulator,
  createNewBrick,
} from '../../state/brick';
import { useEditorCallbacks } from '../../state/editor';
import {
  useEvaluatedData,
  useRenderParams,
  useRenderedData,
} from '../../state/evaluator';
import { errorPreText } from '../../styles/common.css';
import { sprinkles } from '../../styles/sprinkles.css';
import { Mira } from '../../types';
import { CodePreview } from '../CodePreview';
import { Editor, EditorLoaderConfig } from '../Editor';
import { IconButton } from '../atomic/button';
import { PlusIcon } from '../icon/plus';
import * as style from './Block.css';
import { BlockToolbar } from './BlockToolbar';
import { MarkdownPreview } from './MarkdownProvider';

const EvalPresentation: React.VFC<{ brickId: string; mira: Mira }> = ({
  brickId,
  mira,
}) => {
  const settledOutput = useRef<ReturnType<typeof useRenderedData>['output']>();
  const iframeEl = useRef<HTMLIFrameElement>(null);
  // const { output } = useRenderedData(mira.id);
  const { evaluatedData } = useEvaluatedData(mira.id);
  const { renderParams } = useRenderParams(brickId);

  // useEffect(() => {
  //   if (output) {
  //     settledOutput.current = output;
  //   }
  // }, [output]);
  useEffect(() => {
    settledOutput.current = undefined;
  }, [brickId]);

  useEffect(() => {
    if (!evaluatedData) {
      return;
    }
    const { source } = evaluatedData;
    if (!source) {
      return;
    }
    iframeEl.current?.contentWindow?.postMessage(
      {
        type: 'codeChanged',
        source,
      },
      window.location.origin,
    );
  }, [evaluatedData]);

  useEffect(() => {
    if (!renderParams) {
      return;
    }
    iframeEl.current?.contentWindow?.postMessage(
      {
        type: 'parameterChanged',
        params: renderParams,
      },
      window.location.origin,
    );
  }, [renderParams]);

  // Show previous output to avoid a FOIC
  // const currentOutput = output ?? settledOutput.current;
  return (
    <div>
      <iframe ref={iframeEl} src="_mira/-/foo.html"></iframe>
      {/* {currentOutput?.error ? (
        <div>
          <pre className={errorPreText}>{currentOutput.error.toString()}</pre>
        </div>
      ) : (
        currentOutput?.element
      )} */}
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
      <div className={style.livePreviewArea}>
        {brick.type === 'snippet' && brick.mira?.isLived && (
          <div className={style.topSticky}>
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
          <div className={style.topSticky}>
            <div className={style.livePreviewContainer}>
              <pre className={errorPreText}>{String(displayingError)}</pre>
            </div>
          </div>
        )}
      </div>
      <div ref={observerRef} className={style.editorArea}>
        <div
          className={clsx(
            style.topSticky,
            (brick.type === 'note' || brick.type === 'script') &&
              !isActive &&
              sprinkles({ visibility: 'hidden' }),
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
      {brick.type === 'note' && (
        <div
          className={clsx(
            style.notePreviewArea,
            isActive && sprinkles({ visibility: 'hidden' }),
          )}
        >
          <div className={style.markdownPreviewContainer} onClick={setActive}>
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
        </div>
      )}
      {brick.type === 'script' && (
        <div
          className={clsx(
            style.notePreviewArea,
            isActive && sprinkles({ visibility: 'hidden' }),
          )}
        >
          <div className={style.scriptPreviewContainer} onClick={setActive}>
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
        </div>
      )}

      <div
        className={clsx(
          style.topToolbarArea,
          !isFocused &&
            !isActive &&
            sprinkles({
              visibility: 'hidden',
            }),
        )}
      >
        <BlockToolbar id={id} />
      </div>

      <div
        className={clsx(
          style.contentLeftHandleArea,
          !isFocused &&
            !isActive &&
            sprinkles({
              visibility: 'hidden',
            }),
        )}
      />

      <div
        className={clsx(
          style.topLeftArea,
          sprinkles({
            display: 'flex',
            alignItems: 'center',
          }),
          !isFocused &&
            !isActive &&
            sprinkles({
              visibility: 'hidden',
            }),
        )}
      >
        <IconButton
          variant="ghost"
          colorScheme="blue"
          size="sm"
          isRound
          aria-label="Prepend"
          onClick={prependBrick}
        >
          <PlusIcon />
        </IconButton>
      </div>

      <div
        className={clsx(
          style.bottomLeftArea,
          sprinkles({
            display: 'flex',
            alignItems: 'center',
          }),
          !isFocused &&
            !isActive &&
            sprinkles({
              visibility: 'hidden',
            }),
        )}
      >
        <IconButton
          variant="ghost"
          colorScheme="blue"
          size="sm"
          isRound
          aria-label="Append"
          onClick={appendBrick}
        >
          <PlusIcon />
        </IconButton>
      </div>
    </div>
  );
};
