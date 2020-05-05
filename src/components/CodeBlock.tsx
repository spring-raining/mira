import React from 'react';
import { LiveProvider, LiveError, LivePreview, withLive } from 'react-live';
import { Editor } from './Editor';

const LivedEditor = withLive<any>(({ live: { code, onChange } }) => {
  return <Editor code={code} language="jsx" onChange={onChange} />;
});

export const CodeBlock: React.FC<{ note: string }> = ({ note }) => {
  return (
    <LiveProvider code={note}>
      <LivedEditor />
      <LiveError></LiveError>
      <LivePreview></LivePreview>
    </LiveProvider>
  );
};
