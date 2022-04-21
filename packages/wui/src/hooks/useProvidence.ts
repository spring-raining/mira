import { useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilCallback } from 'recoil';
import { useUniverseContext } from '../context';
import { setupProvidence, Providence } from '../live/providence';
import {
  brickModuleImportErrorState,
  miraRenderParamsDictState,
  miraEvaluateStateDictState,
  evaluatePausedState,
} from '../state/atoms';
import { codeFragmentsState, scriptFragmentsState } from '../state/code';
import {
  EvaluateState,
  MiraWuiConfig,
  ModuleImportInfo,
  RenderParamsUpdateInfo,
  RefreshModuleEvent,
  BrickId,
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
  moduleLoader,
  config: { base, depsContext, framework, inputDebounce },
}: {
  mdxPath: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  config: MiraWuiConfig;
}) => {
  const providenceRef = useProvidenceRef();
  const codeFragments = useRecoilValue(codeFragmentsState);
  const scriptFragments = useRecoilValue(scriptFragmentsState);
  const evaluatePaused = useRecoilValue(evaluatePausedState);
  const codeFragmentsWithPrev = usePrevState(codeFragments);
  const scriptFragmentsWithPrev = usePrevState(scriptFragments);
  const providence = useRef<Providence>();
  const miraId = useRef<string[]>([]);
  const { addRefreshModuleListener, removeRefreshModuleListener } =
    useUniverseContext();

  const onEvaluatorUpdate = useRecoilCallback(
    ({ set }) =>
      (evaluated: EvaluateState) => {
        set(miraEvaluateStateDictState, (prev) => ({
          ...prev,
          [evaluated.id]: evaluated,
        }));
      },
    [],
  );

  const onModuleUpdate = useRecoilCallback(
    ({ set }) =>
      (module: ModuleImportInfo<BrickId>) => {
        set(brickModuleImportErrorState, module.importError);
      },
    [],
  );

  const onRenderParamsUpdate = useRecoilCallback(
    ({ set }) =>
      ({ id, params }: RenderParamsUpdateInfo<BrickId>) => {
        set(miraRenderParamsDictState, (prev) => ({
          ...prev,
          [id]: params,
        }));
      },
    [],
  );

  useEffect(() => {
    const p = setupProvidence({
      store: providenceRef.current,
      framework,
      inputDebounce,
      mdxPath,
      base,
      depsContext,
      moduleLoader,
      onEvaluatorUpdate,
      onModuleUpdate,
      onRenderParamsUpdate,
    });
    providence.current = p;
    return p.teardown;
  }, [
    framework,
    inputDebounce,
    mdxPath,
    base,
    depsContext,
    moduleLoader,
    providenceRef,
    onEvaluatorUpdate,
    onModuleUpdate,
    onRenderParamsUpdate,
  ]);

  useEffect(() => {
    const onUpdate = (event: RefreshModuleEvent) => {
      providence.current?.refreshModule(event);
    };
    addRefreshModuleListener(onUpdate);
    return () => removeRefreshModuleListener(onUpdate);
  }, [providenceRef, addRefreshModuleListener, removeRefreshModuleListener]);

  useEffect(() => {
    const [nextCodeFragments, prevCodeFragments = []] = codeFragmentsWithPrev;
    const livedCode = nextCodeFragments.map((brick) => ({
      id: brick.id,
      code: brick.text,
      mira: brick.mira,
    }));
    const deadCode = prevCodeFragments
      .filter((p) => nextCodeFragments.every((n) => p.id !== n.id))
      .map((brick) => ({
        id: brick.id,
        code: undefined,
        mira: undefined,
      }));
    [...livedCode, ...deadCode]
      .filter(({ mira }) => !mira || !miraId.current.includes(mira.id))
      .forEach((changed) => {
        providence.current?.dispatchCodeUpdates(changed);
      });
    miraId.current = livedCode.map(({ mira }) => mira.id);
  }, [providence, codeFragmentsWithPrev]);

  useEffect(() => {
    const [nextScriptFragments, prevScriptFragments = []] =
      scriptFragmentsWithPrev;
    const livedScript = nextScriptFragments
      .filter((n) =>
        prevScriptFragments.every((p) => p.id !== n.id || p.text !== n.text),
      )
      .map((brick) => ({
        id: brick.id,
        scriptNode: brick.ast ?? undefined,
      }));
    const deadScript = prevScriptFragments
      .filter((p) => nextScriptFragments.every((n) => p.id !== n.id))
      .map((brick) => ({ id: brick.id, scriptNode: undefined }));
    [...livedScript, ...deadScript].forEach((changed) => {
      providence.current?.dispatchScriptUpdates(changed);
    });
  }, [providence, scriptFragmentsWithPrev]);

  useEffect(() => {
    if (evaluatePaused) {
      providence.current?.pauseCodeUpdates();
    } else {
      providence.current?.resumeCodeUpdates();
    }
  }, [providence, evaluatePaused]);

  return null;
};
