import { RuntimeEnvironmentFactory } from '@mirajs/core';
import { createElement, Fragment } from 'react';
import { renderElement } from './renderElement';

export const runtimeEnvironmentFactory: RuntimeEnvironmentFactory = () => {
  const exportVal: Record<string, any> = {};
  const referenceVal: Record<string, any> = {};
  const registerVal = (val: Record<string, any>) => {
    for (const [k, v] of Object.entries(val)) {
      if (k === 'default') {
        // ignore default exports
        continue;
      }
      exportVal[k] = v;
    }
  };

  return {
    exportVal,
    referenceVal,
    getRuntimeScope: ({ scopeVal }) => ({
      $def: (val) => {
        if (!val || typeof val !== 'object') {
          throw new Error('Invalid $def reference');
        }
        const duplicated = Object.keys(val).find((v) => v in exportVal);
        if (duplicated) {
          throw new Error(`'${duplicated}' is already defined`);
        }
        if (Object.keys(val).some((v) => v.startsWith('$'))) {
          throw new Error('Cannot define a variable starts with $');
        }
        registerVal(val);
      },
      $use: (name) => {
        if (typeof name !== 'string') {
          throw new Error('Invalid $use reference');
        } else if (!(name in scopeVal)) {
          throw new Error(`'${name}' is not defined`);
        }
        referenceVal[name] = scopeVal[name];
        return scopeVal[name];
      },
      $render: renderElement,
      $jsxFactory: createElement,
      $jsxFragmentFactory: Fragment,
    }),
  };
};
