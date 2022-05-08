import { useRef, useState, useCallback, useEffect } from 'react';
import { genCalleeId } from './../util';

const isBroadcastChannelSupported = 'BroadcastChannel' in globalThis;

// Algorithm detail: https://github.com/zloirock/core-js/blob/ee9e024c81b90248e17ac286e9a4815c1ab7ffd4/packages/core-js/modules/web.structured-clone.js
const assertCloneableValue = <T>(
  target: T,
  getPseudoFunction: (fn: CallableFunction) => unknown,
): T => {
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
  const isObject = (it: unknown) =>
    typeof it == 'object' ? it !== null : typeof it == 'function';
  const toString = uncurryThis({}.toString);
  const stringSlice = uncurryThis(''.slice);
  const classOf = (it: unknown) => stringSlice(toString(it), 8, -1);
  const throwUncloneable = (type: string) => {
    throw new DOMException('Uncloneable type: ' + type);
  };

  function assertValueInternal(
    value: unknown,
    map?: Map<unknown, unknown>,
  ): unknown {
    if (typeof value == 'symbol') {
      return throwUncloneable('Symbol');
    }
    if (!isObject(value)) {
      return value;
    }
    // effectively preserves circular references
    if (map) {
      if (mapHas(map, value)) {
        return mapGet(map, value);
      }
    } else {
      map = new Map();
    }
    const type = classOf(value);

    let cloned = value;
    let deep = false;
    switch (type) {
      case 'Array':
        cloned = [];
        deep = true;
        break;
      case 'Object':
        cloned = {};
        deep = true;
        break;
      case 'Map':
        cloned = new Map();
        deep = true;
        break;
      case 'Set':
        cloned = new Set();
        deep = true;
        break;
      case 'Function':
        return getPseudoFunction(value as CallableFunction);
      case 'RegExp':
      case 'Error':
      case 'DOMException':
      case 'DataView':
      case 'Int8Array':
      case 'Uint8Array':
      case 'Uint8ClampedArray':
      case 'Int16Array':
      case 'Uint16Array':
      case 'Int32Array':
      case 'Uint32Array':
      case 'Float32Array':
      case 'Float64Array':
      case 'BigInt64Array':
      case 'BigUint64Array':
      case 'DOMQuad':
      case 'FileList':
      case 'ImageData':
      case 'BigInt':
      case 'Boolean':
      case 'Number':
      case 'String':
      case 'Date':
      case 'ArrayBuffer':
      case 'SharedArrayBuffer':
      case 'Blob':
      case 'DOMPoint':
      case 'DOMPointReadOnly':
      case 'DOMRect':
      case 'DOMRectReadOnly':
      case 'DOMMatrix':
      case 'DOMMatrixReadOnly':
      case 'AudioData':
      case 'VideoFrame':
      case 'File':
      case 'CryptoKey':
      case 'GPUCompilationMessage':
      case 'GPUCompilationInfo':
      case 'ImageBitmap':
      case 'RTCCertificate':
      case 'WebAssembly.Module':
        break;
      default:
        return throwUncloneable(type);
    }

    mapSet(map, value, cloned);
    if (!deep) {
      return;
    }
    if (type === 'Array' || type === 'Object') {
      const v = value as ArrayLike<unknown>;
      const keys = Object.keys(v);
      for (let i = 0, length = keys.length; i < length; i++) {
        const key = keys[i] as any;
        (cloned as any)[key] = assertValueInternal(v[key], map);
      }
    } else if (type === 'Map') {
      const v = value as Map<unknown, unknown>;
      v.forEach((v, k) => {
        mapSet(
          cloned,
          assertValueInternal(k, map),
          assertValueInternal(v, map),
        );
      });
    } else if (type === 'Set') {
      const v = value as Set<unknown>;
      v.forEach((v) => {
        setAdd(cloned, assertValueInternal(v, map));
      });
    }

    return cloned;
  }

  return assertValueInternal(target) as T;
};

export const useBroadcast = <
  T = Record<string, unknown>,
  K extends string = string,
>(
  name: string,
  kind: K,
) => {
  const [channel, setChannel] = useState<BroadcastChannel | undefined>();
  const [state, setState] = useState<T>();

  const pseudoFunctionRef = useRef(new Map<string, CallableFunction>());
  const getPseudoFunction = useCallback((fn: CallableFunction) => {
    const key = genCalleeId();
    pseudoFunctionRef.current.set(key, fn);
    return {
      __callee: key,
    };
  }, []);

  const postMessage = useCallback(
    (value: T) => {
      if (!channel) {
        return;
      }
      const cloneableValue: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        try {
          cloneableValue[k] = assertCloneableValue(v, getPseudoFunction);
        } catch (error) {
          console.error(
            new Error(
              `Detected uncloneable property in '${k}'. Please consider to define outside of the render function.`,
            ),
          );
          return;
        }
      }
      channel.postMessage({
        kind,
        value: cloneableValue,
      });
      setState(value);
    },
    [channel, kind, getPseudoFunction],
  );

  useEffect(() => {
    const broadcastChannel = isBroadcastChannelSupported
      ? new BroadcastChannel(name)
      : undefined;
    if (broadcastChannel) {
      broadcastChannel.onmessage = (
        event: MessageEvent<{ kind: string; value: any }>,
      ) => {
        if (event.data.kind === kind) {
          setState(event.data.value);
        } else if (event.data.kind === 'functionCall') {
          const { calleeId, args } = event.data.value;
          const fn = pseudoFunctionRef.current.get(calleeId);
          // eslint-disable-next-line prefer-spread, @typescript-eslint/ban-types
          (fn as Function | undefined)?.apply(null, args);
        }
      };
    }
    setChannel(broadcastChannel);
    return () => {
      broadcastChannel?.close();
    };
  }, [name, kind]);

  return [state, postMessage] as const;
};
