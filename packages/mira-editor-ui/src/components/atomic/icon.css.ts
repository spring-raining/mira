import { css, defineStyle } from '../../styles/system.css';

export const icon = defineStyle(
  css({
    w: '1.5em',
    h: '1.5em',
    d: 'inline-block',
    lineHeight: '1em',
    flexShrink: 0,
    color: 'current',
    verticalAlign: 'middle',
  }),
);
