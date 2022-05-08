import { css, defineStyle, defineRecipe } from '../../styles/system.css';

export const InputGroup = defineStyle(
  css({
    w: 'full',
    d: 'flex',
    pos: 'relative',
  }),
);

export const InputElement = defineRecipe({
  base: css({
    d: 'flex',
    h: 'full',
    alignItems: 'center',
    justifyContent: 'center',
    pos: 'absolute',
    top: '0',
    zIndex: 2,
  }),
  variants: {
    placement: {
      left: css({
        insetStart: '0',
      }),
      right: css({
        insetEnd: '0',
      }),
    },
  },
});
