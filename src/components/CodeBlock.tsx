import React, { createContext } from 'react';
import { LiveError, LivePreview, withLive } from 'react-live';
import { evalCode } from 'react-live/dist/react-live';
import { Editor } from './Editor';
import { CodeBlockProvider } from './CodeBlockProvider';

const LivedEditor = withLive<any>(({ live: { code, onChange } }) => {
  return <Editor code={code} language="javascript" onChange={onChange} />;
});

const Code = (props) => <div {...props} className="Code" />;

const $run = (element) => {
  if (typeof element === 'undefined') {
    // errorCallback(new SyntaxError('`render` must be called with valid JSX.'));
  } else {
    // resultCallback(errorBoundary(element, errorCallback));
  }
};

export const CodeBlock: React.FC<{ note: string }> = ({ note }) => {
  return (
    <CodeBlockProvider code={note} scope={{ Code }}>
      <LivedEditor />
      <LiveError></LiveError>
      <LivePreview></LivePreview>
    </CodeBlockProvider>
  );
};
