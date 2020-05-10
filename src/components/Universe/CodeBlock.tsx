import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from 'react';
import { LivePreview, withLive } from 'react-live';
import { nanoid } from 'nanoid';
import { line as spinner } from 'cli-spinners';
import { CodeBlockStatus, UniverseContext } from '../../contexts/universe';
import { useEditorCallbacks } from './useEditorCallbacks';
import { Block, BlockEditorPane, BlockPreviewPane } from './Block';
import { Editor, EditorProps } from '../Editor';
import { CodeBlockProvider } from './CodeBlockProvider';
import * as UI from '../ui';

const LivedEditor = withLive<
  {
    live?: { code: string; onChange: (code: string) => void };
  } & Omit<EditorProps, 'code' | 'language'>
>(({ live: { code, onChange }, ...other }) => {
  const handleChange = useCallback(
    (text) => {
      if (other.onChange) {
        other.onChange(text);
      }
      onChange(text);
    },
    [onChange, other.onChange]
  );
  return (
    <Editor
      {...other}
      code={code}
      language="javascript"
      onChange={handleChange}
    />
  );
});

const LivedError = withLive<any>(({ live: { error } }) =>
  error ? (
    <UI.Box
      my={4}
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
  brickId: string;
  note: string;
  asteroidId: string;
  // providence: Providence;
  onEvaluateStart: (runId: string) => void;
  onEvaluateFinish: (runId: string, ret?: object | null) => void;
}> = ({ brickId, note, asteroidId, onEvaluateStart, onEvaluateFinish }) => {
  const { state } = useContext(UniverseContext);
  const { providence } = state;
  const editorCallbacks = useEditorCallbacks({ brickId });
  const [val, setVal] = useState<Promise<object | null>>();
  const scope = useMemo(
    () => ({
      ...providence.modules,
      ...(providence.asteroid[asteroidId]?.scope || {}),
    }),
    [asteroidId, providence.asteroid, providence.modules]
  );

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
            onEvaluateFinishRef.current(runId);
          }
          onEvaluateFinishRef.current(runId, evaluated);
        })
        .catch(() => {
          onEvaluateFinishRef.current(runId);
        });
    });
  }, [val, providence, asteroidId]);

  const statusString = useMemo(() => {
    const asteroid = providence.asteroid[asteroidId];
    if (!asteroid) {
      return null;
    }
    const { status, stepNo } = asteroid;
    let str = '';
    if (stepNo) {
      str += `[${stepNo}]`;
    }
    if (status === 'outdated') {
      str += '*';
    }
    return str;
  }, [asteroidId, providence]);

  const [loadingSpinner, setLoadingSpinner] = useState<string | null>(null);
  useEffect(() => {
    if (status === 'running') {
      let frame = 0;
      const id = setInterval(() => {
        frame = (frame + 1) % spinner.frames.length;
        setLoadingSpinner(spinner.frames[frame]);
      }, 50);
      return () => clearInterval(id);
    } else {
      setLoadingSpinner(null);
    }
  }, [status]);

  return (
    <CodeBlockProvider
      {...{ status }}
      code={note}
      scope={scope}
      onRender={setVal}
    >
      <Block active={state.activeBrick === brickId}>
        <BlockEditorPane
          pos="relative"
          borderLeft="0.5rem solid"
          borderColor={
            status === 'live'
              ? 'blue.500'
              : status === 'outdated'
              ? 'orange.500'
              : 'gray.400'
          }
        >
          {statusString && (
            <UI.Code pos="absolute" fontSize="xs" backgroundColor="transparent">
              {statusString}
            </UI.Code>
          )}
          {loadingSpinner && (
            <UI.Code
              pos="absolute"
              fontSize="xs"
              backgroundColor="transparent"
              left="0.5rem"
            >
              {loadingSpinner}
            </UI.Code>
          )}
          <LivedEditor {...editorCallbacks} />
        </BlockEditorPane>
        <BlockPreviewPane>
          <LivedError />
          <LivePreview />
        </BlockPreviewPane>
      </Block>
    </CodeBlockProvider>
  );
};
