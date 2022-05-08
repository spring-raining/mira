import { css, defineStyle, defineRecipe } from '../../styles/system.css';

export const formContainer = defineRecipe({
  base: css({
    d: 'flex',
    alignItems: 'center',
    pos: 'relative',
    w: 'full',
    h: 'full',
    borderTopRadius: 'md',
  }),
  variants: {
    isActive: {
      true: css({
        bgColor: 'gray.100',
      }),
    },
  },
});

export const formInput = defineStyle(
  css({
    flex: 1,
    appearance: 'none',
    background: 'inherit',
    pos: 'absolute',
    w: 'full',
    h: 'full',
    ps: 4,
    pe: 20,
    fontFamily: 'mono',
    fontSize: 'sm',
  }),
);

export const formDisplayingCode = defineStyle(
  css({
    flex: 1,
    ps: 4,
    pe: 20,
    fontFamily: 'mono',
    fontSize: 'sm',
  }),
);
