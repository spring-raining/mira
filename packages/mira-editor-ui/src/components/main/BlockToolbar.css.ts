import { css, defineStyle } from '../../styles/system.css';

export const toolbar = defineStyle(
  css({
    w: 'xs',
    h: 8,
    d: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bgColor: 'white',
  }),
);

export const toolbarRightContainer = defineStyle(
  css({
    d: 'flex',
    alignItems: 'center',
    me: 4,
  }),
);
