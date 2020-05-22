import React, {
  useState,
  useCallback,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkReact from 'remark-react';
import styled from '@emotion/styled';
import { UniverseContext } from '../../contexts/universe';
import {
  InsertBlockToolbar,
  ManipulateBlockToolbar,
  ToolbarContainer,
} from './BlockToolBar';
import { useEditorCallbacks } from './useEditorCallbacks';
import { Block, BlockEditorPane, BlockPreviewPane } from './Block';
import { Editor } from '../Editor';

// Styles for Exported markdown
const StyledMarkdownPreview = styled.div`
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.5;
    font-feature-settings: 'palt', 'calt';
    font-weight: 600;
  }

  h1 {
    font-size: 2.4rem;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.6rem;
  }

  h4 {
    font-size: 1.4rem;
  }

  h5 {
    font-size: 1.2rem;
  }

  h6 {
    font-size: 1rem;
  }

  a {
    text-decoration: none;
    color: #3182ce;
  }

  a:hover {
    text-decoration: underline;
    color: #4299e1;
  }

  p {
    margin: 1rem 0;
  }

  ul,
  ol {
    margin: 1rem 0;
    padding-inline-start: 1.5em;
  }

  figure {
    margin: 1.5rem auto;
    text-align: center;
    img {
      max-width: 100%;
      margin: 0.5rem auto;
    }
    figcaption {
      margin: 1rem auto;
      width: 90%;
      font-size: 90%;
    }
  }

  table {
    display: table;
    max-width: 100%;
    margin: 1rem auto;
    border-color: currentColor;
    border-collapse: collapse;
    th,
    td {
      padding: 0.2em 0.2em 0.2em 0;
      &:first-child {
        padding-left: 0.2em;
      }
      background-color: transparent;
      border: 0;
    }
    th {
      border-top: 1px solid;
      border-bottom: 1px solid;
    }
    tr {
      border-bottom: 1px solid;
    }
    tr:last-child {
      border-bottom: 1px solid;
    }
  }

  pre {
    line-height: 1.2;
    border-radius: 0.2rem;
    background-color: rgba(0, 0, 0, 0.08);
    margin: 1em 0;
    padding: 1em;
  }
  code {
    padding: 0.2rem 0.4rem;
    background-color: rgba(0, 0, 0, 0.08);
    border-radius: 0.2rem;
  }
  pre > code {
    padding: 0;
    background-color: initial;
  }

  blockquote {
    margin: 1em 0;
    padding: 1em 0.5em;
    border-radius: 0.2rem;
    background-color: rgba(0, 0, 0, 0.08);
  }
  blockquote > p {
    margin: 0;
  }
  blockquote > blockquote {
    margin: 0;
  }

  hr {
    margin: 1rem 0;
    border-color: currentColor;
  }
`;

export const MarkdownBlock: React.FC<{ brickId: string; note: string }> = ({
  brickId,
  note,
}) => {
  const { state } = useContext(UniverseContext);
  const editorCallbacks = useEditorCallbacks({ brickId });
  const brickIndex = useMemo(
    () => state.bricks.findIndex((brick) => brick.brickId === brickId),
    [state.bricks, brickId]
  );

  const [code, setCode] = useState(() => note);
  const [rendered, setRendered] = useState(null);
  const [hover, setHover] = useState(false);

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
    const rendered: any = unified()
      .use(remarkParse)
      .use(remarkReact)
      .processSync(code);
    setRendered(rendered.result);
  }, [code]);

  return (
    <Block active={state.activeBrick === brickId} {...blockCallbacks}>
      <BlockEditorPane>
        {brickId && (
          <Editor
            {...editorCallbacks}
            {...{ onChange }}
            language="markdown"
            code={note}
          />
        )}
      </BlockEditorPane>
      <BlockPreviewPane py={2}>
        <StyledMarkdownPreview>{rendered || null}</StyledMarkdownPreview>
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
