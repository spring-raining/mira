import { useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { setupProvidence, Providence } from '../live/providence';
import { brickDictState, miraEvaluatedDataDictState } from '../state/atoms';
import { Brick, SnippetBrick, Mira, EvaluatedResult } from '../types';
import { useProvidenceRef } from './providence/context';

const usePrevState = <T>(state: T): [T, T | undefined] => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = state;
  });
  return [state, ref.current];
};

export const ProvidenceObserver = () => {
  const providenceRef = useProvidenceRef();
  const brickDict = useRecoilValue(brickDictState);
  const brickDictWithPrev = usePrevState(brickDict);
  const providence = useRef<Providence>();
  const miraId = useRef<string[]>([]);

  const onEvaluatorUpdate = useRecoilCallback(
    ({ set }) => (evaluated: EvaluatedResult) => {
      set(miraEvaluatedDataDictState, (prev) => ({
        ...prev,
        [evaluated.id]: evaluated,
      }));
    },
    []
  );

  useEffect(() => {
    const p = setupProvidence({
      store: providenceRef.current,
      onEvaluatorUpdate,
    });
    providence.current = p;
    return p.teardown;
  }, [providenceRef, onEvaluatorUpdate]);

  useEffect(() => {
    const [nextBrickDict, prevBrickDict = {}] = brickDictWithPrev;
    const isLivedBrick = (
      brick: Brick
    ): brick is SnippetBrick & { mira: Mira } =>
      brick.type === 'snippet' && !!brick.mira?.isLived;
    const livedCode = Object.values(nextBrickDict)
      .filter(isLivedBrick)
      .map((brick) => ({
        brickId: brick.id,
        code: brick.text,
        mira: brick.mira,
      }));
    const deadCode = Object.values(prevBrickDict)
      .filter((brick) => isLivedBrick(brick) && !(brick.id in nextBrickDict))
      .map((brick) => ({
        brickId: brick.id,
        code: undefined,
        mira: undefined,
      }));

    [...livedCode, ...deadCode]
      .filter(({ mira }) => !mira || !miraId.current.includes(mira.id))
      .forEach((changed) => {
        providence.current?.dispatch(changed);
      });
    miraId.current = livedCode.map(({ mira }) => mira.id);
  }, [providence, brickDictWithPrev]);

  return null;
};
