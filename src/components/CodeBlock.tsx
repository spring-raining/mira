import React, { useMemo } from 'react';
import { LiveError, LivePreview, withLive } from 'react-live';
import { evalCode } from 'react-live/dist/react-live';
import { Block, BlockEditorPane, BlockPreviewPane } from './Block';
import { Editor } from './Editor';
import { CodeBlockProvider } from './CodeBlockProvider';
import * as UI from './ui';
import { Providence } from './Universe';

const LivedEditor = withLive<any>(({ live: { code, onChange } }) => (
  <Editor code={code} language="javascript" onChange={onChange} />
));

const LivedError = withLive<any>(({ live: { error } }) =>
  error ? (
    <UI.Box
      p={2}
      rounded="md"
      fontSize="70%"
      lineHeight="1.25"
      color="white"
      bg="red.600"
    >
      <pre>{error}</pre>
    </UI.Box>
  ) : null
);

export const CodeBlock: React.FC<{
  note: string;
  providence: Providence;
  onProvidenceUpdate: (val: Providence) => void;
  asteroidId?: string;
}> = ({ note, asteroidId, providence, onProvidenceUpdate }) => {
  const scope = useMemo(() => ({}), []);

  return (
    <CodeBlockProvider
      code={note}
      scope={scope}
      asteroidId={asteroidId}
      providence={providence}
      onProvidenceUpdate={onProvidenceUpdate}
    >
      <Block>
        <BlockEditorPane>
          <LivedEditor />
        </BlockEditorPane>
        <BlockPreviewPane>
          <LivedError />
          <LivePreview />
        </BlockPreviewPane>
      </Block>
    </CodeBlockProvider>
  );
};
