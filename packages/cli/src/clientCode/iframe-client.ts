import type { MiraEvalBase } from '@mirajs/core';

let presentationElement = document.querySelector<MiraEvalBase>('mira-eval');
if (!presentationElement) {
  presentationElement = document.createElement('mira-eval') as MiraEvalBase;
  document.body.appendChild(presentationElement);
}

let broadcastChannel: BroadcastChannel | null = null;

function handleCodeChange({ source }: { source: string }) {
  presentationElement?.loadScript(source);
}

function handleParameterChange(clonedProps: Record<string, unknown>) {
  if (!presentationElement) {
    return;
  }
  const props = hydrateClonedObject(clonedProps);
  presentationElement.props = props;
}

function handlePresentationUpdate() {
  broadcastChannel?.postMessage({
    kind: 'presentationUpdate',
    value: {
      time: Date.now(),
    },
  });
}

function createResponseFunction(calleeId: string): () => any {
  return (...args: any[]) => {
    broadcastChannel?.postMessage({
      kind: 'functionCall',
      value: { calleeId, args },
    });
  };
}

function hydrateClonedObject<T extends Record<string, unknown>>(object: T): T {
  const uncurryThis = function <T, F extends (...args: any[]) => any>(
    fn: F,
  ): (thisArg: T, ...rest: Parameters<F>) => ReturnType<F> {
    return function () {
      return Function.prototype.call.apply(
        fn,
        // eslint-disable-next-line prefer-rest-params
        arguments as unknown as [any, ...any[]],
      );
    };
  };
  const mapHas = uncurryThis(Map.prototype.has);
  const mapGet = uncurryThis(Map.prototype.get);
  const mapSet = uncurryThis(Map.prototype.set);
  const setAdd = uncurryThis(Set.prototype.add);
  const toString = uncurryThis({}.toString);
  const stringSlice = uncurryThis(''.slice);
  const classOf = (it: unknown) => stringSlice(toString(it), 8, -1);

  function hydrate(value: unknown, map?: Map<unknown, unknown>): unknown {
    if (map) {
      if (mapHas(map, value)) {
        return mapGet(map, value);
      }
    } else {
      map = new Map();
    }
    const type = classOf(value);

    if (type === 'Array') {
      const cloned: unknown[] = [];
      mapSet(map, value, cloned);
      const v = value as Array<unknown>;
      const keys = Object.keys(v);
      for (let i = 0, length = keys.length; i < length; i++) {
        const key = keys[i] as any;
        cloned[key] = hydrate(v[key], map);
      }
      return cloned;
    } else if (type === 'Object') {
      const v = value as Record<string, unknown>;
      if ('__callee' in v && typeof v.__callee === 'string') {
        const { __callee: calleeId } = v;
        return createResponseFunction(calleeId);
      }
      const cloned: Record<string, unknown> = {};
      mapSet(map, value, cloned);
      const keys = Object.keys(v);
      for (let i = 0, length = keys.length; i < length; i++) {
        const key = keys[i] as any;
        cloned[key] = hydrate(v[key], map);
      }
      return cloned;
    } else if (type === 'Map') {
      const cloned = new Map();
      mapSet(map, value, cloned);
      const v = value as Map<unknown, unknown>;
      v.forEach((v, k) => {
        mapSet(cloned, hydrate(k, map), hydrate(v, map));
      });
      return cloned;
    } else if (type === 'Set') {
      const cloned = new Set();
      mapSet(map, value, cloned);
      const v = value as Set<unknown>;
      v.forEach((v) => {
        setAdd(cloned, hydrate(v, map));
      });
      return cloned;
    } else {
      mapSet(map, value, value);
      return value;
    }
  }

  return hydrate(object) as T;
}

const onBroadcastMessage = (
  event: MessageEvent<{ kind: string; value: any }>,
) => {
  if (event.data.kind === 'config') {
    console.log(event.data.value);
  }
  if (event.data.kind === 'code') {
    handleCodeChange(event.data.value);
  }
  if (event.data.kind === 'parameter') {
    handleParameterChange(event.data.value);
  }
};

const openBroadcast = (name: string) => {
  if (broadcastChannel) {
    broadcastChannel.close();
  }
  broadcastChannel = new BroadcastChannel(name);
  broadcastChannel.onmessage = onBroadcastMessage;
  presentationElement?.addEventListener('update', handlePresentationUpdate);
};

const closeBroadcast = (name: string) => {
  if (broadcastChannel?.name !== name) {
    return;
  }
  broadcastChannel?.close();
  broadcastChannel = null;
  presentationElement?.removeEventListener('update', handlePresentationUpdate);
};

const onPeerMessage = (name: string) => (event: MessageEvent) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  if (typeof event.data === 'string' && event.data.startsWith('disconnect:')) {
    closeBroadcast(name);
  }
};

async function init() {
  window.__MIRA_HMR__ = {
    update: () => {
      // do nothing
    },
  };

  const query = new URLSearchParams(window.location.search);
  const evaluatorUrl = query.get('framework');
  if (evaluatorUrl) {
    // define <mira-eval> element
    const { MiraEval } = await import(evaluatorUrl);
    window.customElements.define('mira-eval', MiraEval);
  }

  const broadcastName = query.get('broadcastName');
  if (broadcastName) {
    openBroadcast(broadcastName);
    window.addEventListener('message', onPeerMessage(broadcastName));
  }

  window.postMessage('load-client', window.location.origin);
}

window.addEventListener('load', init);

export {};
