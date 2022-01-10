import {
  MenuDescendantsProvider,
  MenuProvider,
  useMenu,
  useMenuButton,
  useMenuList,
  useMenuItem,
  useMenuPositioner,
} from '@chakra-ui/menu';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import { Button, ButtonProps } from './button';
import * as style from './menu.css';
import { forwardRef } from './util';

export const Menu: React.FC = ({ children }) => {
  const { descendants, ...ctx } = useMenu({});
  const context = useMemo(() => ctx, [ctx]);

  return (
    <MenuDescendantsProvider value={descendants}>
      <MenuProvider value={context}>{children}</MenuProvider>
    </MenuDescendantsProvider>
  );
};

export const MenuButton = forwardRef<'button', HTMLButtonElement, ButtonProps>(
  ({ children, ...other }, ref) => {
    const buttonProps = useMenuButton(other, ref);

    return (
      <Button {...buttonProps}>
        <span className={style.menuButtonSpan}>{children}</span>
      </Button>
    );
  },
);

export type MenuListProps = {
  rootProps?: JSX.IntrinsicElements['div'];
};

export const MenuList = forwardRef<'div', HTMLDivElement, MenuListProps>(
  ({ rootProps, ...other }, ref) => {
    const menulistProps = useMenuList(other, ref);
    const positionerProps = useMenuPositioner(rootProps);

    return (
      <div {...positionerProps}>
        <div
          {...menulistProps}
          className={clsx(style.menuList, menulistProps.className)}
        />
      </div>
    );
  },
);

export type MenuItemProps = {
  icon?: React.ReactElement;
  command?: string;
};

export const MenuItem = forwardRef<'button', HTMLButtonElement, MenuItemProps>(
  ({ icon, command, children, ...other }, ref) => {
    const menuitemProps = useMenuItem(other, ref);

    const shouldWrap = icon || command;

    const _children = shouldWrap ? (
      <span style={{ pointerEvents: 'none', flex: 1 }}>{children}</span>
    ) : (
      children
    );

    return (
      <button
        {...menuitemProps}
        className={clsx(style.menuItem, menuitemProps.className)}
      >
        {icon && <MenuIcon>{icon}</MenuIcon>}
        {_children}
        {command && <MenuCommand>{command}</MenuCommand>}
      </button>
    );
  },
);

export const MenuCommand = forwardRef<'span', HTMLSpanElement>(
  ({ className, ...other }, ref) => {
    return (
      <span
        {...other}
        {...{ ref }}
        className={clsx(style.menuCommand, className)}
      />
    );
  },
);

export const MenuIcon: React.FC<JSX.IntrinsicElements['span']> = ({
  className,
  children,
  ...other
}) => {
  const child = React.Children.only(children);

  const clone = React.isValidElement(child)
    ? React.cloneElement(child, {
        focusable: 'false',
        'aria-hidden': true,
        className: child.props.className,
      })
    : null;

  return (
    <span {...other} className={clsx(style.menuIcon, className)}>
      {clone}
    </span>
  );
};

export const MenuDivider = forwardRef<'hr', HTMLHRElement>(
  ({ className, ...other }, ref) => {
    return (
      <hr
        {...other}
        {...{ ref }}
        role="separator"
        aria-orientation="horizontal"
        className={clsx(style.menuDivider, className)}
      />
    );
  },
);
