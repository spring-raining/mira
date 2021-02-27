export interface RuntimeScope {
  $run(element: any): void;
  $val(...args: any[]): void;
  $use(val: any): void;
}

export interface RuntimeEvaluatee {
  render: any;
  exportVal: Record<string, any>;
  referenceVal: Record<string, any>;
}

export const getRuntimeScope = ({
  scope,
  errorCallback,
}: {
  scope: Record<string, unknown>;
  errorCallback: (error: Error) => void;
}): [RuntimeScope, RuntimeEvaluatee] => {
  const evaluatee: RuntimeEvaluatee = {
    render: null,
    exportVal: new Proxy<Record<string, any>>(
      {},
      {
        get: (target, prop) => {
          return target[String(prop)];
        },
        set: (target, prop, value) => {
          // TODO: hoist code here
          console.debug('set', prop, value);
          target[String(prop)] = value;
          return true;
        },
      }
    ),
    referenceVal: {},
  };
  const registerVal = (vals: Record<string, any>) => {
    for (let [k, v] of Object.entries(vals)) {
      const set = (val: any) => {
        evaluatee.exportVal[k] = val;
      };
      if (typeof v === 'function') {
        const run = () => {
          const callbackId = window.requestIdleCallback(() => {
            try {
              set(v(run));
            } catch (error) {
              window.cancelIdleCallback(callbackId);
              errorCallback(error);
            }
          });
        };
        run();
      } else {
        set(v);
      }
    }
  };

  return [
    {
      $run: (element: any) => {
        if (element !== undefined) {
          evaluatee.render = element;
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
          (v) => v in evaluatee.exportVal
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
        evaluatee.referenceVal[val] = scope[val];
        return scope[val];
      },
    },
    evaluatee,
  ];
};
