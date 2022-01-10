import clsx from 'clsx';
import React from 'react';
import * as style from './input.css';
import { forwardRef } from './util';

export const Input = forwardRef<'input', HTMLInputElement>((props, ref) => {
  return <input {...props} {...{ ref }} />;
});

export const InputGroup = forwardRef<'div', HTMLDivElement>(
  ({ className, ...other }, ref) => {
    return (
      <div
        {...other}
        {...{ ref }}
        className={clsx(style.InputGroup, className)}
      />
    );
  },
);

export const InputElement = forwardRef<
  'div',
  HTMLDivElement,
  {
    placement: 'left' | 'right';
  }
>(({ placement, className, ...other }, ref) => {
  return (
    <div
      {...other}
      {...{ ref }}
      className={clsx(style.InputElement({ placement }), className)}
    />
  );
});
