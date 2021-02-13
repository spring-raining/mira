import React, {
  useEffect,
  useCallback,
  useRef,
  useContext,
  useReducer,
  useState,
} from 'react';
import { nanoid } from 'nanoid';
import { updateProject } from '../actions/workspace';
import {
  Asteroid,
  Providence,
  UniverseContext,
  universeContextInitialState,
  universeContextReducer,
  ScriptBrick,
  UniverseContextState,
} from '../contexts/universe';
import { WorkspaceContext } from '../contexts/workspace';
import { AsteroidNote, ScriptNote } from '../mdx';
import { importMdx, exportMdx } from '../mdx/io';
import { collectImports, loadModule } from '../mdx/module';
import { ToolBar } from './Universe/ToolBar';
import { NewBlockButtonSet } from './Universe/NewBlockButtonSet';
import { useRuler, EvaluationEvent } from './Universe/useRuler';
import { CodeBlock } from './Universe/CodeBlock';
import { MarkdownBlock } from './Universe/MarkdownBlock';
import { ScriptPart, UserScriptPart } from './Universe/ScriptPart';
import * as UI from './ui';

const buildInitialUniverse = async (
  mdx?: string
): Promise<Partial<UniverseContextState>> => {
  let { note, config, frontmatter } = importMdx(mdx || '');

  const userScript: UniverseContextState['userScript'] = {
    noteType: 'script',
    brickId: nanoid(),
    children: (config.module || []).map((mod) => ({
      id: nanoid(),
      type: 'import',
      value: mod,
    })),
  };
  const [firstBlock, ...latterBlocks] = note;
  if (firstBlock?.noteType === 'script') {
    note = latterBlocks;
    userScript.children = [
      ...(userScript.children || []),
      ...firstBlock.children,
    ];
  }

  const importDefs = collectImports(
    [userScript, ...note].filter(
      ({ noteType }) => noteType === 'script'
    ) as ScriptNote[]
  );
  const imports = await Promise.all(importDefs.map(loadModule));

  const asteroids = note.filter(
    ({ noteType }) => noteType === 'asteroid'
  ) as AsteroidNote[];
  const providence: Providence = {
    asteroid: asteroids.reduce<{ [id: string]: Asteroid }>((acc, { id }) => {
      return {
        ...acc,
        [id]: {
          result: null,
          status: 'init',
          scope: {},
        },
      };
    }, {}),
    asteroidOrder: asteroids.map(({ id }) => id),
    imports,
  };
  return {
    bricks: note.map((block) => ({ ...block, brickId: nanoid() })),
    providence,
    frontmatter,
    ...(userScript && { userScript }),
  };
};

interface UniverseProps {
  projectName: string;
  mdx?: string;
}

const UniverseView: React.FC<UniverseProps> = ({ projectName, mdx }) => {
  const { state, dispatch } = useContext(UniverseContext);
  const workspace = useContext(WorkspaceContext);

  const { bricks, providence, userScript, frontmatter } = state;
  const { arbitrate } = useRuler(state);
  const [initialized, setInitialized] = useState(false);
  const [initializedBrickIds, setInitializedBrickIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const evaluationEventStack = useRef<EvaluationEvent[]>([]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      if (evaluationEventStack.current.length === 0) {
        id = requestAnimationFrame(tick);
        return;
      }
      const event = evaluationEventStack.current.shift()!;
      dispatch({
        providence: arbitrate(event),
      });

      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [providence]);

  const onBrickReady = useCallback(
    (brickId: string) => {
      if (!initializedBrickIds.includes(brickId)) {
        setInitializedBrickIds([...initializedBrickIds, brickId]);
      }
    },
    [initializedBrickIds]
  );

  const onEvaluateStart = useCallback((asteroidId: string, runId: string) => {
    evaluationEventStack.current.push({
      type: 'start',
      asteroidId,
      runId,
    });
  }, []);

  const onEvaluateFinish = useCallback(
    (asteroidId: string, runId: string, ret?: object | null) => {
      evaluationEventStack.current.push({
        type: 'finish',
        asteroidId,
        runId,
        ret,
      });
    },
    []
  );

  useEffect(() => {
    setInitialized(false);
    setReady(false);
    (async () => {
      const state = await buildInitialUniverse(mdx);
      dispatch(state);
      setInitializedBrickIds([]);
      setInitialized(true);
    })();
  }, [mdx]);

  useEffect(() => {
    if (!initialized || ready) {
      return;
    }
    const ids = bricks
      .filter(
        ({ noteType }) => noteType === 'markdown' || noteType === 'asteroid'
      )
      .map(({ brickId }) => brickId);
    if (ids.every((id) => initializedBrickIds.includes(id))) {
      setReady(true);
    }
  }, [initialized, ready, bricks, initializedBrickIds]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const { asteroidOrder, asteroid } = providence;
    const initIdx = asteroidOrder.findIndex(
      (id) => asteroid[id]?.status === 'init'
    );
    const runningIdx = asteroidOrder.findIndex(
      (id) => asteroid[id]?.status === 'running'
    );
    if (initIdx >= 0 && (initIdx < runningIdx || runningIdx < 0)) {
      const runner = asteroid[asteroidOrder[initIdx]];
      dispatch({
        providence: {
          ...providence,
          asteroid: {
            ...asteroid,
            [asteroidOrder[initIdx]]: {
              ...runner,
              status: 'running',
            },
          },
        },
      });
    }
  }, [ready, providence]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    // Auto save after editing
    const timeoutId = setTimeout(() => {
      const mdx = exportMdx({ bricks, userScript, frontmatter });
      workspace.dispatch(updateProject({ name: projectName, mdx }));
    }, 2000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [ready, bricks, userScript, frontmatter, workspace.dispatch, projectName]);

  return (
    <UI.Box w="100%">
      <ToolBar title={`${projectName}.mdx`} />
      {!ready && (
        <UI.Flex justify="center" my={8}>
          <UI.Spinner size="xl" thickness="4px" color="purple.500" />
        </UI.Flex>
      )}
      <UI.Box
        visibility={ready ? 'visible' : 'hidden'}
        height={ready ? 'auto' : 0}
        overflowY={ready ? 'initial' : 'hidden'}
      >
        <UserScriptPart />
        {bricks.map((brick, i) => {
          const { noteType, text, brickId } = brick;
          if (noteType === 'markdown') {
            return (
              <MarkdownBlock
                key={brickId}
                brickId={brickId}
                note={text}
                onReady={() => onBrickReady(brickId)}
              />
            );
          } else if (noteType === 'asteroid') {
            const { id } = brick as Omit<AsteroidNote, 'children'>;
            return (
              <CodeBlock
                key={brickId}
                brickId={brickId}
                note={text}
                asteroidId={id}
                onReady={() => onBrickReady(brickId)}
                onEvaluateStart={(...v) => onEvaluateStart(id, ...v)}
                onEvaluateFinish={(...v) => onEvaluateFinish(id, ...v)}
              />
            );
          } else if (noteType === 'script') {
            return <ScriptPart key={brickId} note={brick as ScriptBrick} />;
          }
        })}
        <UI.Flex justify="center" my={6}>
          <NewBlockButtonSet />
        </UI.Flex>
      </UI.Box>
    </UI.Box>
  );
};

export const Universe: React.FC<UniverseProps> = (props) => {
  const [state, dispatch] = useReducer(
    universeContextReducer,
    universeContextInitialState
  );
  return (
    <UniverseContext.Provider value={{ state, dispatch }}>
      <UniverseView {...props} />
    </UniverseContext.Provider>
  );
};
