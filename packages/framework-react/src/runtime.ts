import type { RuntimeEnvironmentFactory } from '@mirajs/util';
import { createElement, Fragment } from 'react';
import { render as ReactDOMRender, unmountComponentAtNode } from 'react-dom';
import { RuntimeEnvironmentConfig } from './types';

export const runtime: RuntimeEnvironmentFactory<
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

export default runtime;
