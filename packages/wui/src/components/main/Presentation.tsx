import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useBroadcast } from '../../hooks/useBroadcast';
import { useMemoWithPrev } from '../../hooks/useMemoWithPrev';
import { pathJoin, resolveImportSpecifier } from '../../mdx/imports';
import { useConfig } from '../../state/config';
import {
  useEvaluatedResultLoadable,
  useRenderParams,
} from '../../state/evaluator';
import { sprinkles } from '../../styles/sprinkles.css';
import { BrickId, Mira } from '../../types';
import * as style from './Block.css';

export const Presentation: React.VFC<{ brickId: BrickId; mira: Mira }> = ({
  brickId,
  mira,
}) => {
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const { evaluatedResultLoadable: result } = useEvaluatedResultLoadable(
    mira.id,
  );
  const { renderParams } = useRenderParams(brickId);
  const [, postCode] = useBroadcast<{ source: string }>(brickId, 'code');
  const [, postParameter] = useBroadcast(brickId, 'parameter');
  const [presentationUpdate] = useBroadcast<{ time: number }>(
    brickId,
    'presentationUpdate',
  );
  const [presentationError] = useBroadcast<{ error: Error; time: number }>(
    brickId,
    'presentationError',
  );
  const config = useConfig();
  const iframeSrc = useMemo(() => {
    const path = pathJoin(config.base, config.depsContext, '/-/index.html');
    const frameworkSpecifier = resolveImportSpecifier({
      specifier: config.framework,
      base: config.base,
      depsContext: config.depsContext,
    });
    const url = new URL(path, window.location.origin);
    url.searchParams.set('broadcastName', brickId);
    url.searchParams.set('framework', frameworkSpecifier);
    return url.href;
  }, [config, brickId]);

  const [isConnected, setConnected] = useState(false);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(32);
  const resizeIframeHeight = useCallback(() => {
    const body = iframeEl.current?.contentWindow?.document?.body;
    if (body) {
      setIframeHeight(body.scrollHeight);
    }
  }, []);

  useEffect(() => {
    const iframe = iframeEl.current;
    if (!iframe) {
      return;
    }
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data === 'load-client') {
        iframe.contentWindow?.postMessage(
          `connect:${brickId}`,
          window.location.origin,
        );
        setConnected(true);
      }
    };
    iframe.contentWindow?.addEventListener('message', handleMessage);
    return () => {
      iframe.contentWindow?.postMessage(
        `disconnect:${brickId}`,
        window.location.origin,
      );
      iframe.contentWindow?.removeEventListener('message', handleMessage);
      setConnected(false);
    };
  }, [brickId, config]);

  useEffect(() => {
    if (!isConnected || result.state !== 'hasValue' || !result.contents) {
      return;
    }
    const { source, hasDefaultExport } = result.contents;
    setShowIframe(hasDefaultExport);
    if (!source || !hasDefaultExport) {
      return;
    }
    postCode({ source });
  }, [isConnected, result, postCode]);

  useEffect(() => {
    if (!isConnected || !renderParams) {
      return;
    }
    const obj: Record<string, unknown> = {};
    for (const [k, v] of renderParams.entries()) {
      obj[k] = v;
    }
    postParameter(obj);
  }, [isConnected, renderParams, postParameter]);

  useEffect(() => {
    resizeIframeHeight();
  }, [presentationUpdate, resizeIframeHeight]);

  const displayingError = useMemoWithPrev<Error | undefined>(
    (prev) => {
      if (result.state === 'loading') {
        return prev;
      }
      if (result.state === 'hasError') {
        return result.contents;
      }
      if (result.contents?.error) {
        return result.contents?.error;
      } else if (
        presentationError &&
        (!presentationUpdate ||
          presentationError.time > presentationUpdate.time)
      ) {
        return presentationError.error;
      }
    },
    [result, presentationError, presentationUpdate],
  );

  return (
    <>
      <iframe
        ref={iframeEl}
        src={iframeSrc}
        className={sprinkles({
          display: showIframe && !displayingError ? 'flex' : 'none',
        })}
        style={{ width: '100%', height: iframeHeight, minHeight: '4rem' }}
      ></iframe>
      {displayingError && (
        <pre className={style.errorPreText({ errorType: 'scriptError' })}>
          {String(displayingError)}
        </pre>
      )}
      <div className={style.debuggerContainer}>
        <div>
          <code>
            {result.state} {mira.id}
          </code>
        </div>
        <div>
          <code>id: {result?.contents?.id}</code>
        </div>
        <div>
          <code>envId: {result?.contents?.environment?.envId}</code>
        </div>
        <div>
          <code>{result?.contents?.source}</code>
        </div>
      </div>
    </>
  );
};
