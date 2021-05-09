import { css } from 'lightwindcss';
import React from 'react';
import {
  useMarkdownRenderer,
  MarkdownProvider,
} from '../hooks/useMarkdownRenderer';

const useMarkdownStyling = () => {
  const markdownStyling = css`
    display: flex;
    flex-direction: column;

    * {
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      color: #1A202C;
      line-height: 1.5;
      border-width: 0;
      border-style: solid;
      box-sizing: border-box;
    }
    blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre {
      margin: 0;
    }
    pre, code, kbd, samp {
      font-family: SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size: 1em;
    }
    p {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    a {
      cursor: pointer;
      text-decoration: none;
      outline: none;
      color: #3182ce;
      word-wrap: break-word;
    }
    a:hover {
      text-decoration: underline;
    }
    a:focus {
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.6);
    }
    hr {
      box-sizing: content-box;
      height: 0;
      overflow: visible;
      border-top-width: 1px;
      border-color: currentColor;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      font-weight: 700;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 2.25rem;
      line-height: 1.2;
    }
    h2 {
      font-size: 1.875rem;
      line-height: 1.33;
    }
    h3 {
      font-size: 1.5rem;
      line-height: 1.33;
    }
    h4 {
      font-size: 1.25rem;
      line-height: 1.2;
    }
    h5 {
      font-size: 1.125rem;
      line-height: 1.2;
    }
    h6 {
      font-size: 1rem;
      line-height: 1.2;
    }
    blockquote {
      width: 100%;
      display: block;
      position: relative;
      overflow: hidden;
      padding-inline-start: 1rem;
      padding-inline-end: 1rem;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      margin-top: 1rem;
      margin-bottom: 1rem;
      background-color: rgba(0, 0, 0, 0.06);
      border-radius: 0.5rem;
    }
    ul, ol {
      margin: 0;
      padding: 0;
      margin-inline-start: 1em;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    table {
      font-variant-numeric: lining-nums tabular-nums;
      border-collapse: collapse;
      width: 100%;
    }
    th {
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: start;
      padding-inline-start: 1.5rem;
      padding-inline-end: 1.5rem;
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
      line-height: 1rem;
      font-size: 0.75rem;
      color: #4A5568;
      border-bottom: 1px solid;
      border-color: #EDF2F7;
    }
    tr:last-of-type th {
      border-bottom-width: 0;
    }
    td {
      text-align: start;
      padding-inline-start: 1.5rem;
      padding-inline-end: 1.5rem;
      padding-top: 1rem;
      padding-bottom: 1rem;
      line-height: 1.25rem;
      border-bottom: 1px solid;
      border-color: #EDF2F7;
    }
    pre {
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    pre > code {
      display: inline-block;
      font-size: 0.75rem;
      width: 100%;
      padding-inline-start: 1.5rem;
      padding-inline-end: 1.5rem;
      padding-top: 1rem;
      padding-bottom: 1rem;
      background-color: #EDF2F7;
      border-radius: 0.5rem;
      line-height: 1.4;
      overflow-x: auto;
    }
    :not(pre) > code {
      padding-inline-start: 0.2em;
      padding-inline-end: 0.2em;
      margin-inline-start: 0.25rem;
      margin-inline-end: 0.25rem;
      background-color: #EDF2F7;
      border-radius: 0.125rem;
    }
  `;
  return { markdownStyling };
}

export const MarkdownPreview: React.VFC<{ md: string }> = ({ md }) => {
  const { element } = useMarkdownRenderer(md);
  const { markdownStyling } = useMarkdownStyling();

  return (
    <MarkdownProvider>
      <div
        className={markdownStyling}
      >
        {element}
      </div>
    </MarkdownProvider>
  );
};
