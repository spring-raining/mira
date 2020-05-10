import React, {
  useEffect,
  useCallback,
  useRef,
  useContext,
  useReducer,
} from 'react';
import { nanoid } from 'nanoid';
import {
  Asteroid,
  Providence,
  UniverseContext,
  universeContextInitialState,
  universeContextReducer,
  ScriptBrick,
} from '../contexts/universe';
import {
  importMdx,
  collectImports,
  AsteroidNote,
  ScriptNote,
} from '../remark/importMdx';
import { NewBlockButtonSet } from './Universe/NewBlockButtonSet';
import { useRuler, EvaluationEvent } from './Universe/useRuler';
import { CodeBlock } from './Universe/CodeBlock';
import { MarkdownBlock } from './Universe/MarkdownBlock';
import { ScriptPart } from './Universe/ScriptPart';
import * as UI from './ui';

interface UniverseProps {
  mdx?: string;
}

const UniverseView: React.FC<UniverseProps> = ({ mdx }) => {
  const { state, dispatch } = useContext(UniverseContext);

  const { bricks, providence } = state;
  const { arbitrate } = useRuler(state);

  const evaluationEventStack = useRef<EvaluationEvent[]>([]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      if (evaluationEventStack.current.length === 0) {
        id = requestAnimationFrame(tick);
        return;
      }
      const event = evaluationEventStack.current.shift();
      dispatch({
        providence: arbitrate(event),
      });

      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [providence]);

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
    (async () => {
      const codeBlock = importMdx(mdx || '');
      console.log(codeBlock);
      const modules = await collectImports(
        codeBlock.filter(
          ({ noteType }) => noteType === 'script'
        ) as ScriptNote[]
      );

      const asteroids = codeBlock.filter(
        ({ noteType }) => noteType === 'asteroid'
      ) as AsteroidNote[];
      const providence: Providence = {
        asteroid: asteroids.reduce<{ [id: string]: Asteroid }>(
          (acc, { id }) => {
            return {
              ...acc,
              [id]: {
                result: null,
                status: 'init',
                scope: {},
              },
            };
          },
          {}
        ),
        asteroidOrder: asteroids.map(({ id }) => id),
        modules,
      };
      dispatch({
        bricks: codeBlock.map((block) => ({ ...block, brickId: nanoid() })),
        providence,
      });
    })();
  }, [mdx]);

  useEffect(() => {
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
  }, [providence]);

  return (
    <>
      <UI.Heading>Universe</UI.Heading>
      {bricks.map((brick) => {
        const { noteType, text, brickId } = brick;
        if (noteType === 'markdown') {
          return <MarkdownBlock key={brickId} brickId={brickId} note={text} />;
        } else if (noteType === 'asteroid') {
          const { id } = brick as Omit<AsteroidNote, 'children'>;
          return (
            <CodeBlock
              key={brickId}
              brickId={brickId}
              note={text}
              asteroidId={id}
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
    </>
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
