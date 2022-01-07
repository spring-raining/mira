import { css, style } from './system.css';

export const errorPreText = style(
  css({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'red.500',
    whiteSpace: 'pre-wrap',
  })
);

export const iconSvg = style(
  css({
    height: 6,
  })
);
