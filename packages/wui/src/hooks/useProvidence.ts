import { useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { useUniverseContext } from '../context';
import { setupProvidence, Providence } from '../live/providence';
import {
  brickDictState,
  brickModuleImportErrorState,
  miraEvaluatedDataDictState,
} from '../state/atoms';
import {
  Brick,
  SnippetBrick,
  Mira,
  EvaluatedResult,
  ModuleImportState,
  RefreshModuleEvent,
} from '../types';
import { useProvidenceRef } from './providence/context';

const usePrevState = <T>(state: T): [T, T | undefined] => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = state;
  });
  return [state, ref.current];
};

export const ProvidenceObserver = ({
  mdxPath,
  depsRootPath,
  moduleLoader,
}: {
  mdxPath: string;
  depsRootPath: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
}) => {
  const providenceRef = useProvidenceRef();
  const brickDict = useRecoilValue(brickDictState);
  const brickDictWithPrev = usePrevState(brickDict);
  const providence = useRef<Providence>();
  const miraId = useRef<string[]>([]);
  const {
    addRefreshModuleListener,
    removeRefreshModuleListener,
  } = useUniverseContext();

  const onEvaluatorUpdate = useRecoilCallback(
    ({ set }) => (evaluated: EvaluatedResult) => {
      set(miraEvaluatedDataDictState, (prev) => ({
        ...prev,
        [evaluated.id]: evaluated,
      }));
    },
    []
  );

  const onModuleUpdate = useRecoilCallback(
    ({ set }) => (module: ModuleImportState) => {
      set(brickModuleImportErrorState, module.importError);
    },
    []
  );

  useEffect(() => {
    const p = setupProvidence({
      store: providenceRef.current,
      mdxPath,
      depsRootPath,
      moduleLoader,
      onEvaluatorUpdate,
      onModuleUpdate,
    });
    providence.current = p;
    return p.teardown;
  }, [
    mdxPath,
    depsRootPath,
    moduleLoader,
    providenceRef,
    onEvaluatorUpdate,
    onModuleUpdate,
  ]);

  useEffect(() => {
    const onUpdate = (event: RefreshModuleEvent) => {
      providence.current?.refreshModule(event);
    };
    addRefreshModuleListener(onUpdate);
    return () => removeRefreshModuleListener(onUpdate);
  }, [providenceRef, addRefreshModuleListener, removeRefreshModuleListener]);

  useEffect(() => {
    const [nextBrickDict, prevBrickDict = {}] = brickDictWithPrev;
    const isLivedBrick = (
      brick: Brick
    ): brick is SnippetBrick & { mira: Mira } =>
      brick.type === 'snippet' && !!brick.mira?.isLived;
    const livedCode = Object.values(nextBrickDict)
      .filter(isLivedBrick)
      .map((brick) => ({
        id: brick.id,
        code: brick.text,
        mira: brick.mira,
      }));
    const deadCode = Object.values(prevBrickDict)
      .filter((brick) => isLivedBrick(brick) && !(brick.id in nextBrickDict))
      .map((brick) => ({
        id: brick.id,
        code: undefined,
        mira: undefined,
      }));
    const nextScripts = Object.values(nextBrickDict).filter(
      ({ type }) => type === 'script'
    );
    const prevScripts = Object.values(prevBrickDict).filter(
      ({ type }) => type === 'script'
    );
    const livedScript = nextScripts
      .filter((n) =>
        prevScripts.every((p) => p.id !== n.id || p.text !== n.text)
      )
      .map((brick) => ({
        id: brick.id,
        scriptNode: brick.children ?? undefined,
      }));
    const deadScript = prevScripts
      .filter((p) => nextScripts.every((n) => p.id !== n.id))
      .map((brick) => ({ id: brick.id, scriptNode: undefined }));

    // Dispatch script updates earlier than code updates to wait for module imports
    [...livedScript, ...deadScript].forEach((changed) => {
      providence.current?.dispatchScriptUpdates(changed);
    });
    [...livedCode, ...deadCode]
      .filter(({ mira }) => !mira || !miraId.current.includes(mira.id))
      .forEach((changed) => {
        providence.current?.dispatchCodeUpdates(changed);
      });
    miraId.current = livedCode.map(({ mira }) => mira.id);
  }, [providence, brickDictWithPrev]);

  return null;
};
