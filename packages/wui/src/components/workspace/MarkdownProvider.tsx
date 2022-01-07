import React from 'react';
import {
  useMarkdownRenderer,
  MarkdownProvider,
} from '../../hooks/useMarkdownRenderer';
import { markdownStyling } from './MarkdownProvider.css';

export const MarkdownPreview: React.VFC<{ md: string }> = ({ md }) => {
  const { element } = useMarkdownRenderer(md);

  return (
    <MarkdownProvider>
      <div className={markdownStyling}>{element}</div>
    </MarkdownProvider>
  );
};
