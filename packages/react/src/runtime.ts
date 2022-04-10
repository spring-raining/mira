import type { RuntimeEnvironmentFactory } from '@mirajs/core';
import { createElement, Fragment } from 'react';
import { render as ReactDOMRender, unmountComponentAtNode } from 'react-dom';
import { RuntimeEnvironmentConfig } from './types';

export const runtimeEnvironmentFactory: RuntimeEnvironmentFactory<
  RuntimeEnvironmentConfig
> = () => {
  return {
    getRuntimeScope: () => ({
      $mount: (element, container) => {
        ReactDOMRender(element, container);
      },
      $unmount: (element, container) => {
        unmountComponentAtNode(container);
      },
      $jsxFactory: createElement,
      $jsxFragmentFactory: Fragment,
    }),
  };
};

export default runtimeEnvironmentFactory;
