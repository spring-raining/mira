import { css, defineStyle } from '../../styles/system.css';

export const listContainer = defineStyle(
  css({
    w: 'full',
    pos: 'relative',
    willChange: 'height',
  }),
);

export const listItem = defineStyle(
  css({
    pos: 'absolute',
    left: 0,
    w: '100%',
    willChange: 'top',
  }),
);
