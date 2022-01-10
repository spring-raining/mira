import React from 'react';

export function forwardRef<
  K extends keyof JSX.IntrinsicElements,
  T extends HTMLElement | SVGElement,
  P = Record<string, unknown>,
  PP = JSX.IntrinsicElements[K],
>(render: React.ForwardRefRenderFunction<T, PP & P>) {
  return React.forwardRef<T, PP & P>(render);
}
