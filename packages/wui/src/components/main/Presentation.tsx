import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useBroadcast } from '../../hooks/useBroadcast';
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

  const [showIframe, setShowIframe] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(32);
  const resizeIframeHeight = useCallback(() => {
    const body = iframeEl.current?.contentWindow?.document?.body;
    if (body) {
      setIframeHeight(body.scrollHeight + 32);
    }
  }, []);

  useEffect(() => {
    const iframe = iframeEl.current;
    if (!iframe) {
      return;
    }
    const handleLoad = () => {
      iframe.contentWindow?.postMessage(
        `connect:${brickId}`,
        window.location.origin,
      );
    };
    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.contentWindow?.postMessage(
        `disconnect:${brickId}`,
        window.location.origin,
      );
      iframe.removeEventListener('load', handleLoad);
    };
  }, [brickId]);

  useEffect(() => {
    if (result.state !== 'hasValue') {
      return;
    }
    const { source, hasDefaultExport } = result.contents;
    setShowIframe(hasDefaultExport);
    if (!source || !hasDefaultExport) {
      return;
    }
    postCode({ source });
    resizeIframeHeight();
  }, [result, postCode, resizeIframeHeight]);

  useEffect(() => {
    if (!renderParams) {
      return;
    }
    const obj: Record<string, unknown> = {};
    for (const [k, v] of renderParams.entries()) {
      obj[k] = v;
    }
    postParameter(obj);
    resizeIframeHeight();
  }, [renderParams, postParameter, resizeIframeHeight]);

  const [displayingError, setDisplayingError] = useState<Error>();
  useEffect(() => {
    if (result.state === 'hasValue') {
      setDisplayingError(result.contents.error);
    }
  }, [result]);

  return (
    <>
      <iframe
        ref={iframeEl}
        src="/_mira/-/foo.html"
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
