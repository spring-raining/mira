import React, { useEffect, useRef } from 'react';
import { useBroadcast } from '../../hooks/useBroadcast';
import { useEvaluatedData, useRenderParams } from '../../state/evaluator';
import { Mira } from '../../types';

export const Presentation: React.VFC<{ brickId: string; mira: Mira }> = ({
  brickId,
  mira,
}) => {
  const iframeEl = useRef<HTMLIFrameElement>(null);
  const { evaluatedData } = useEvaluatedData(mira.id);
  const { renderParams } = useRenderParams(brickId);
  const [, postCode] = useBroadcast<{ source: string }>(brickId, 'code');
  const [, postParameter] = useBroadcast(brickId, 'parameter');

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
    const source = evaluatedData?.source;
    if (!source) {
      return;
    }
    postCode({ source });
  }, [evaluatedData, postCode]);

  useEffect(() => {
    if (!renderParams) {
      return;
    }
    const obj: Record<string, unknown> = {};
    for (const [k, v] of renderParams.entries()) {
      obj[k] = v;
    }
    postParameter(obj);
  }, [renderParams, postParameter]);

  return (
    <div>
      <iframe ref={iframeEl} src="_mira/-/foo.html"></iframe>
    </div>
  );
};
