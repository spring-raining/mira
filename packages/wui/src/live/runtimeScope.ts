import { nanoid } from 'nanoid';
import { createElement, Fragment } from 'react';
import { RuntimeEnvironment, RuntimeScope } from '../types';

export const setupRuntimeEnvironment = (): RuntimeEnvironment => {
  const environment: RuntimeEnvironment = {
    envId: nanoid(),
    render: null,
    exportVal: new Proxy<Record<string, any>>(
      {},
      {
        get: (target, prop) => {
          return target[String(prop)];
        },
        set: (target, prop, value) => {
          target[String(prop)] = value;
          return true;
        },
      },
    ),
    referenceVal: {},
    getRuntimeScope: ({
      scope,
    }: {
      scope: Record<string, unknown>;
    }): RuntimeScope => {
      const registerVal = (vals: Record<string, any>) => {
        for (const [k, v] of Object.entries(vals)) {
          if (k === 'default') {
            // ignore default exports
            continue;
          }
          environment.exportVal[k] = v;
        }
      };

      return {
        $run: (element: any) => {
          if (element !== undefined) {
            environment.render = element;
          }
        },
        $val: (...args: any[]) => {
          let val: Record<string, any> = {};
          if (args.length === 1 && args[0] && typeof args[0] === 'object') {
            val = args[0];
          } else if (
            args.length === 2 &&
            (typeof args[0] === 'string' || typeof args[1] === 'number')
          ) {
            val = { [args[0]]: args[1] };
          } else {
            throw new Error('Invalid $val usage');
          }
          const duplicated = Object.keys(val).find(
            (v) => v in environment.exportVal,
          );
          if (duplicated) {
            throw new Error(`'${duplicated}' is already defined`);
          }
          if (Object.keys(val).some((v) => v.startsWith('$'))) {
            throw new Error('Cannot define a val starts with $');
          }
          registerVal(val);
        },
        $use: (val: any) => {
          if (typeof val !== 'string' && typeof val !== 'number') {
            throw new Error('Invalid $use usage');
          } else if (!(val in scope)) {
            throw new Error(`'${val}' is not defined`);
          }
          environment.referenceVal[val] = scope[val];
          return scope[val];
        },
        $jsxFactory: createElement,
        $jsxFragment: Fragment,
      };
    },
  };
  return environment;
};
