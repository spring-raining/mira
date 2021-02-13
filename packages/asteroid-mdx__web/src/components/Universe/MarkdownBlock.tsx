import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import styled from '@emotion/styled';
import { UniverseContext } from '../../contexts/universe';
import { useMarkdownRenderer } from '../../hooks/useMarkdownRenderer';
import {
  InsertBlockToolbar,
  ManipulateBlockToolbar,
  ToolbarContainer,
} from './BlockToolBar';
import { useEditorCallbacks } from './useEditorCallbacks';
import { Block, BlockEditorPane, BlockPreviewPane } from './Block';
import { Editor } from '../Editor';

const StyledMarkdownPreview = styled.div`
  code {
    background-color: rgba(0, 0, 0, 0.08);
  }
`;

export const MarkdownBlock: React.FC<{
  brickId: string;
  note: string;
  onReady?: () => void;
}> = ({ brickId, note, onReady = () => {} }) => {
  const { state } = useContext(UniverseContext);
  const editorCallbacks = useEditorCallbacks({ brickId });
  const brickIndex = useMemo(
    () => state.bricks.findIndex((brick) => brick.brickId === brickId),
    [state.bricks, brickId]
  );

  const [code, setCode] = useState(() => note);
  const [hover, setHover] = useState(false);
  const [ready, setReady] = useState(false);

  const { element } = useMarkdownRenderer(code);

  const blockCallbacks = {
    onMouseOver: useCallback(() => setHover(true), []),
    onMouseOut: useCallback(() => setHover(false), []),
  };

  const onChange = useCallback(
    (note) => {
      editorCallbacks.onChange(note);
      setCode(note);
    },
    [editorCallbacks.onChange]
  );

  useEffect(() => {
    if (ready) {
      onReady();
    }
  }, [ready, onReady]);

  return (
    <Block
      active={state.activeBrick === brickId}
      {...blockCallbacks}
      visibility={ready ? 'visible' : 'hidden'}
      height={ready ? 'auto' : 0}
    >
      <BlockEditorPane>
        {brickId && (
          <Editor
            {...editorCallbacks}
            {...{ onChange }}
            onReady={() => setReady(true)}
            language="markdown"
            code={note}
          />
        )}
      </BlockEditorPane>
      <BlockPreviewPane py={2}>
        <StyledMarkdownPreview>{element}</StyledMarkdownPreview>
      </BlockPreviewPane>
      {brickIndex === 0 && (
        <ToolbarContainer side="top" left={0} show={hover}>
          <InsertBlockToolbar index={0} />
        </ToolbarContainer>
      )}
      <ToolbarContainer side="bottom" left={0} show={hover}>
        <InsertBlockToolbar index={brickIndex + 1} />
      </ToolbarContainer>
      <ToolbarContainer side="bottom" right={0} show={hover}>
        <ManipulateBlockToolbar index={brickIndex} />
      </ToolbarContainer>
    </Block>
  );
};
