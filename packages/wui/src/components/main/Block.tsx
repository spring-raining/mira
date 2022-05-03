import clsx from 'clsx';
import React, { useCallback, useEffect, useRef } from 'react';
import * as editorTheme from '../../editor/theme';
import { useCombinedRefs } from '../../hooks/useCombineRef';
import { usePrevState } from '../../hooks/usePrevState';
import { useStop } from '../../hooks/useStop';
import { useBrick, useBrickManipulator } from '../../state/brick';
import { useEvaluatedResultLoadable } from '../../state/evaluator';
import { createNewBrick } from '../../state/helper';
import { sprinkles } from '../../styles/sprinkles.css';
import { BrickId } from '../../types';
import { noop } from '../../util';
import { CodePreview } from '../CodePreview';
import { Editor } from '../Editor';
import { IconButton } from '../atomic/button';
import { forwardRef } from '../atomic/util';
import { PlusIcon } from '../icon/plus';
import * as style from './Block.css';
import { BlockToolbar } from './BlockToolbar';
import { MarkdownPreview } from './MarkdownProvider';
import { Presentation } from './Presentation';

export type BlockPropType = {
  id: BrickId;
  inView: boolean;
};

const useBrickInView = ({ id, inView }: BlockPropType) => {
  if (!inView) {
    // Cancel rendering and throw to parent suspense
    throw new Promise(noop);
  }
  return useBrick(id);
};

const BlockLivePreviewArea: React.VFC<BlockPropType> = ({ id, inView }) => {
  const { parseError, moduleImportError, literalBrickData } = useBrickInView({
    id,
    inView,
  });
  return (
    <div className={style.livePreviewArea}>
      <div className={style.topSticky}>
        <div className={style.livePreviewContainer}>
          {parseError ? (
            <pre className={style.errorPreText({ errorType: 'parseError' })}>
              {String(parseError.error)}
            </pre>
          ) : moduleImportError ? (
            <pre className={style.errorPreText({ errorType: 'scriptError' })}>
              {String(moduleImportError)}
            </pre>
          ) : (
            literalBrickData &&
            literalBrickData.mira?.isLived && (
              <Presentation brickId={id} mira={literalBrickData.mira} />
            )
          )}
        </div>
      </div>
    </div>
  );
};

const BlockEditorArea: React.VFC<BlockPropType> = ({ id, inView }) => {
  const { brick, swap, literalBrickData, isActive } = useBrickInView({
    id,
    inView,
  });
  const { evaluatedResultLoadable } = useEvaluatedResultLoadable(
    literalBrickData?.mira?.id,
  );
  return (
    <div className={style.editorArea}>
      <div
        className={clsx(
          style.topSticky,
          (brick.type === 'note' || brick.type === 'script') &&
            !isActive &&
            sprinkles({ visibility: 'hidden' }),
        )}
      >
        <div className={style.editorContainer({ isActive })}>
          <Editor
            brickId={id}
            errorMarkers={
              evaluatedResultLoadable.state === 'hasValue'
                ? evaluatedResultLoadable.contents?.errorMarkers
                : []
            }
            warnMarkers={
              evaluatedResultLoadable.state === 'hasValue'
                ? evaluatedResultLoadable.contents?.warnMarkers
                : []
            }
          />
        </div>
      </div>
      <div className={style.debuggerContainer}>
        <div>
          <code>brick: {brick.id}</code>
        </div>
        <div>
          <code>mira: {brick.type === 'snippet' && brick.mira?.id}</code>
        </div>
        <div>
          <code>swap: {swap?.mira?.id}</code>
        </div>
      </div>
    </div>
  );
};

/**
 * Pseudo element that is exactly same size with BlockEditorArea
 * to keep the content height on offscreen view.
 */
const BlockOffScreenEditorArea: React.VFC<Pick<BlockPropType, 'id'>> = ({
  id,
}) => {
  const { brick } = useBrick(id);

  return (
    <div className={style.editorArea}>
      <div
        className={clsx(style.topSticky, sprinkles({ visibility: 'hidden' }))}
      >
        <div
          style={{
            fontFamily: editorTheme.fontFamily,
            fontSize: editorTheme.fontSize,
            lineHeight: editorTheme.lineHeight,
            padding: editorTheme.contentPadding,
          }}
        >
          <div
            style={{
              padding: editorTheme.linePadding,
              wordBreak: 'break-all',
              whiteSpace: 'pre-wrap',
            }}
          >
            {brick.text}
          </div>
        </div>
      </div>
    </div>
  );
};

const BlockNotePreviewArea: React.VFC<BlockPropType> = ({ id }) => {
  const { brick, parseError, isActive, setActive } = useBrick(id);
  return (
    <>
      {brick.type === 'note' && (
        <div
          className={clsx(
            style.notePreviewArea,
            isActive && sprinkles({ visibility: 'hidden' }),
          )}
        >
          <div className={style.markdownPreviewContainer} onClick={setActive}>
            {parseError?.parsedText ? (
              <pre>
                <code className={style.scriptPreviewCode}>
                  <div>{parseError.parsedText}</div>
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
                    code={parseError?.parsedText || brick.text}
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
    </>
  );
};

const BlockTools: React.VFC<BlockPropType> = ({ id, inView }) => {
  const { isActive, isFocused } = useBrickInView({ id, inView });
  const { insertBrick } = useBrickManipulator();

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

  return (
    <>
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
    </>
  );
};

export const Block = forwardRef<'div', HTMLDivElement, BlockPropType>(
  ({ id, inView }, ref) => {
    const { isActive, setFocused } = useBrick(id);
    const virtualRef = useRef<HTMLDivElement>(null);
    const combinedVirtualRef = useCombinedRefs(virtualRef, ref);
    const stop = useStop();

    const containerCallbacks = {
      onMouseOver: useCallback(() => {
        if (inView) {
          setFocused(true);
        }
      }, [setFocused, inView]),
      onMouseOut: useCallback(() => {
        if (inView) {
          setFocused(false);
        }
      }, [setFocused, inView]),
      onClick: stop,
    };

    const [nextViewState, prevViewState] = usePrevState({ inView, isActive });
    useEffect(() => {
      // Scroll to visible position if this block was selected but it's offscreen
      if (
        !prevViewState?.isActive &&
        nextViewState.isActive &&
        !nextViewState.inView
      ) {
        virtualRef.current?.scrollIntoView({ block: 'nearest' });
      }
    }, [nextViewState, prevViewState]);

    return (
      <div className={style.blockContainer} {...containerCallbacks}>
        <div
          ref={combinedVirtualRef}
          className={style.blockVirtualRefArea}
        ></div>

        <React.Suspense fallback={null}>
          <BlockLivePreviewArea {...{ id, inView }} />
        </React.Suspense>

        <React.Suspense fallback={<BlockOffScreenEditorArea {...{ id }} />}>
          <BlockEditorArea {...{ id, inView }} />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <BlockNotePreviewArea {...{ id, inView }} />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <BlockTools {...{ id, inView }} />
        </React.Suspense>
      </div>
    );
  },
);
