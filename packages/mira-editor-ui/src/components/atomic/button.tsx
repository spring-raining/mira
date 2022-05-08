import clsx from 'clsx';
import React from 'react';
import * as style from './button.css';
import { forwardRef } from './util';

export type ButtonProps = Parameters<typeof style.button>[0];

export const Button = forwardRef<'button', HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      colorScheme = 'blue',
      variant = 'solid',
      size = 'md',
      ...other
    },
    ref,
  ) => {
    return (
      <button
        {...other}
        {...{ ref }}
        className={clsx(
          style.button({ colorScheme, variant, size }),
          className,
        )}
      />
    );
  },
);

export type IconButtonProps = ButtonProps & {
  icon?: React.ReactElement;
  isRound?: boolean;
  'aria-label': string;
};

export const IconButton = forwardRef<
  'button',
  HTMLButtonElement,
  IconButtonProps
>(
  (
    {
      className,
      colorScheme,
      variant,
      size,
      icon,
      isRound,
      'aria-label': ariaLabel,
      children,
      ...other
    },
    ref,
  ) => {
    /**
     * Passing the icon as prop or children should work
     */
    const element = icon || children;
    const _children = React.isValidElement(element)
      ? React.cloneElement(element as any, {
          'aria-hidden': true,
          focusable: false,
        })
      : null;

    return (
      <Button
        {...other}
        {...{ colorScheme, variant, size, ref }}
        aria-label={ariaLabel}
        className={clsx(style.iconButton({ isRound }), className)}
      >
        {_children}
      </Button>
    );
  },
);
