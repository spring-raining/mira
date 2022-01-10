import { css, defineStyle } from './system.css';

export const errorPreText = defineStyle(
  css({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'red.500',
    whiteSpace: 'pre-wrap',
  }),
);
