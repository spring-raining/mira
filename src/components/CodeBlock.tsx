import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { LiveError, LivePreview, withLive } from 'react-live';
import { evalCode } from 'react-live/dist/react-live';
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
  providence: Providence;
  onProvidenceUpdate: (val: Providence) => void;
  asteroidId: string;
}> = ({ note, asteroidId, providence, onProvidenceUpdate }) => {
  const [val, setVal] = useState<Promise<object | null>>();
  const [status, setStatus] = useState<CodeBlockStatus | null>(() =>
    asteroidId in providence.asteroidStatus
      ? providence.asteroidStatus[asteroidId]
      : null
  );
  const scope = useMemo(() => ({}), []);
  const statusString =
    asteroidId in providence.asteroidStatus
      ? providence.asteroidStatus[asteroidId]
      : null;

  useEffect(() => {
    setStatus(
      asteroidId in providence.asteroidStatus
        ? providence.asteroidStatus[asteroidId]
        : null
    );
  }, [providence.asteroidStatus, asteroidId]);

  // Evaluate code result
  const currentVal = useRef<Promise<object | null>>();
  const currentProvidence = useRef<Providence>(providence);
  useEffect(() => {
    currentProvidence.current = providence;
    if (currentVal.current === val) {
      return;
    }
    currentVal.current = val;
    setStatus('running');
    requestAnimationFrame(() => {
      const p = currentProvidence.current || providence;
      const asteroidReturn = { ...p.asteroidReturn };
      delete asteroidReturn[asteroidId];
      onProvidenceUpdate({
        ...p,
        asteroidReturn,
        asteroidStatus: {
          ...p.asteroidStatus,
          [asteroidId]: 'running',
        },
      });
      val
        .then((evaluated) => {
          if (currentVal.current !== val) {
            return;
          }
          const p = currentProvidence.current || providence;
          onProvidenceUpdate({
            ...p,
            asteroidReturn: {
              ...p.asteroidReturn,
              [asteroidId]: evaluated,
            },
            asteroidStatus: {
              ...p.asteroidStatus,
              [asteroidId]: 'live',
            },
          });
        })
        .catch((e) => {
          if (currentVal.current !== val) {
            return;
          }
          const p = currentProvidence.current || providence;
          onProvidenceUpdate({
            ...p,
            asteroidStatus: {
              ...p.asteroidStatus,
              [asteroidId]: 'live',
            },
          });
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
        {statusString && (
          <UI.Code pos="absolute" fontSize="xs">
            {statusString}
          </UI.Code>
        )}
      </Block>
    </CodeBlockProvider>
  );
};
