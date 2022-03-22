import { css, defineStyle } from '../../styles/system.css';

export const menuButtonSpan = defineStyle(
  css({
    pointerEvents: 'none',
    flex: 1,
    minW: 0,
  }),
);

export const menuList = defineStyle(
  css({
    bg: 'white',
    boxShadow: 'sm',
    color: 'inherit',
    minW: '3xs',
    py: 2,
    zIndex: 1,
    borderRadius: 'md',
    borderWidth: '1px',
  }),
);

export const menuItem = defineStyle([
  css({
    textDecoration: 'none',
    color: 'inherit',
    userSelect: 'none',
    d: 'flex',
    w: 'full',
    alignItems: 'center',
    textAlign: 'start',
    flex: 0,
    outline: 0,

    py: '0.2rem',
    px: 4,
  }),
  {
    ':focus': css({
      bg: 'gray.100',
    }),
    ':active': css({
      bg: 'gray.200',
    }),
  },
]);

export const menuIcon = defineStyle(
  css({
    flexShrink: 0,
    fontSize: 'xs',
    me: 3,
  }),
);

export const menuCommand = defineStyle(
  css({
    opacity: 0.6,
    fontSize: 'sm',
    ms: 3,
  }),
);

export const menuDivider = defineStyle(
  css({
    border: 0,
    borderBottom: '1px',
    borderColor: 'inherit',
    my: '0.5rem',
    opacity: 0.6,
  }),
);
