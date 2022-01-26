import type { RuntimeEnvironmentFactory } from '@mirajs/core';
import { createElement, Fragment } from 'react';
import { renderElement } from './renderElement';

export const runtimeEnvironmentFactory: RuntimeEnvironmentFactory = () => {
  const exportVal = new Map<string, unknown>();
  const referenceVal = new Map<string, unknown>();
  const registerVal = (val: Record<string, any>) => {
    for (const [k, v] of Object.entries(val)) {
      if (k === 'default') {
        // ignore default exports
        continue;
      }
      exportVal.set(k, v);
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
        } else if (!scopeVal.has(name)) {
          throw new Error(`'${name}' is not defined`);
        }
        referenceVal.set(name, scopeVal.get(name));
        return scopeVal.get(name);
      },
      $render: renderElement,
      $jsxFactory: createElement,
      $jsxFragmentFactory: Fragment,
    }),
  };
};
