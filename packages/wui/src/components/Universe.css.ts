import { styleVariants } from '@vanilla-extract/css';
import { css, defineStyle } from '../styles/system.css';

export const displayColumn = styleVariants({
  oneColumn: {},
  twoColumn: {},
});

export const universeContainer = defineStyle(
  css({
    w: 'full',
    d: 'flex',
  }),
);

export const planetarySystemPane = defineStyle(
  css({
    w: '12rem',
  }),
);

export const planetarySystemSticky = defineStyle(
  css({
    top: 0,
    pos: 'sticky',
    py: 20,
  }),
);

export const mainPane = defineStyle(
  css({
    flex: 1,
  }),
);

export const mainSticky = defineStyle(
  css({
    w: 'full',
    pos: 'sticky',
    top: 0,
    py: 20,
  }),
);
