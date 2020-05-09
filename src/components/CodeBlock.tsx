import React, { useMemo, useState, useEffect, useRef } from 'react';
import { LivePreview, withLive } from 'react-live';
import { nanoid } from 'nanoid';
import { Block, BlockEditorPane, BlockPreviewPane } from './Block';
import { Editor } from './Editor';
import { CodeBlockProvider } from './CodeBlockProvider';
import * as UI from './ui';
import { Providence, CodeBlockStatus } from './Universe';

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
  asteroidId: string;
  providence: Providence;
  onEvaluateStart: (runId: string) => void;
  onEvaluateFinish: (runId: string, ret?: object | null) => void;
}> = ({ note, asteroidId, providence, onEvaluateStart, onEvaluateFinish }) => {
  const [val, setVal] = useState<Promise<object | null>>();
  const scope = useMemo(() => providence.asteroid[asteroidId]?.scope || {}, [
    asteroidId,
    providence.asteroid,
  ]);

  const status = providence.asteroid[asteroidId]?.status || null;

  // Evaluate code result
  const currentStatus = useRef<CodeBlockStatus | null>();
  const currentVal = useRef<Promise<object | null>>();
  const runIdRef = useRef<string>();
  const onEvaluateFinishRef = useRef<
    (runId: string, ret?: object | null) => void
  >();
  useEffect(() => {
    if (currentVal.current === val) {
      return;
    }
    currentStatus.current = status;
    currentVal.current = val;
    if (!val) {
      return;
    }
    const runId = nanoid();
    runIdRef.current = runId;
    onEvaluateFinishRef.current = onEvaluateFinish;
    onEvaluateStart(runId);
    requestAnimationFrame(() => {
      val
        .then((evaluated) => {
          if (
            runId !== runIdRef.current &&
            currentStatus.current !== 'running'
          ) {
            return;
          }
          onEvaluateFinishRef.current(runId, evaluated);
        })
        .catch(() => {
          if (
            runId !== runIdRef.current &&
            currentStatus.current !== 'running'
          ) {
            return;
          }
          onEvaluateFinishRef.current(runId);
        });
    });
  }, [val, providence, asteroidId]);

  return (
    <CodeBlockProvider
      {...{ status }}
      code={note}
      scope={scope}
      onRender={setVal}
    >
      <Block pos="relative">
        <BlockEditorPane>
          <LivedEditor />
        </BlockEditorPane>
        <BlockPreviewPane>
          <LivedError />
          <LivePreview />
        </BlockPreviewPane>
        {status && (
          <UI.Code pos="absolute" fontSize="xs">
            {status}
          </UI.Code>
        )}
      </Block>
    </CodeBlockProvider>
  );
};
