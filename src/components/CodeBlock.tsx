import React from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';

export const CodeBlock: React.FC<{ note: string }> = ({ note }) => {
  return (
    <LiveProvider code={note}>
      <LiveEditor></LiveEditor>
      <LiveError></LiveError>
      <LivePreview></LivePreview>
    </LiveProvider>
  );
};
