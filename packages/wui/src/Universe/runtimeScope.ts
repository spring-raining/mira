export interface RuntimeScope {
  $run(element: any): void;
  $val(...args: any[]): void;
  $use(val: any): void;
}

export interface RuntimeEnvironment {
  render: any;
  exportVal: Record<string, any>;
  referenceVal: Record<string, any>;
  getRuntimeScope: (e: {
    scope: Record<string, unknown>;
    errorCallback: (error: Error) => void;
  }) => RuntimeScope;
  teardown: () => void;
}

export const setupRuntimeEnvironment = (): RuntimeEnvironment => {
  let stalled = false;
  const teardownFunctions: (() => void)[] = [];
  const environment: RuntimeEnvironment = {
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
      }
    ),
    referenceVal: {},
    getRuntimeScope: ({
      scope,
      errorCallback,
    }: {
      scope: Record<string, unknown>;
      errorCallback: (error: Error) => void;
    }): RuntimeScope => {
      const registerVal = (vals: Record<string, any>) => {
        for (let [k, v] of Object.entries(vals)) {
          const set = (val: any) => {
            environment.exportVal[k] = val;
          };
          if (typeof v === 'function') {
            const callbackIdList: number[] = [];
            const clearCallbacks = () => {
              let id: number | undefined;
              while ((id = callbackIdList.shift())) {
                window.cancelIdleCallback(id);
              }
            };
            // eslint-disable-next-line no-loop-func
            const run = () => {
              if (stalled) {
                return;
              }
              const callbackId = window.requestIdleCallback(() => {
                try {
                  clearCallbacks();
                  callbackIdList.push(callbackId);
                  set(v(run));
                } catch (error) {
                  window.cancelIdleCallback(callbackId);
                  errorCallback(error);
                }
              });
            };
            teardownFunctions.push(clearCallbacks);
            run();
          } else {
            set(v);
          }
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
            (v) => v in environment.exportVal
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
      };
    },
    teardown: () => {
      stalled = true;
      teardownFunctions.forEach((fn) => fn());
    },
  };
  return environment;
};
