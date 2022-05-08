import clsx from 'clsx';
import React from 'react';
import * as style from './icon.css';
import { forwardRef } from './util';

export const Icon = forwardRef<'svg', SVGSVGElement>(
  ({ className, ...other }, ref) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        {...other}
        {...{ ref }}
        className={clsx(style.icon, className)}
      />
    );
  },
);
