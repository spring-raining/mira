import { css, style, recipe } from '../../styles/system.css';
import { vars } from '../../styles/themes.css';

export const planetarySystemContainer = style(
  css({
    transitionProperty: 'margin-top',
    transitionTimingFunction: 'ease-in-out',
    transitionDuration: 'normal',
  }),
);

export const itemRow = recipe({
  base: [
    css({
      d: 'flex',
      alignItems: 'center',
      h: 6,
      cursor: 'pointer',
      bgColor: 'white',
      opacity: 1,
    }),
    {
      ':hover': css({
        bgColor: 'gray.100',
      }),
    },
  ],
  variants: {
    isSelected: {
      true: [
        css({
          bgColor: 'cyan.50',
        }),
        {
          ':hover': css({
            bgColor: 'cyan.50',
          }),
        },
      ],
    },
    isDragging: {
      true: css({
        opacity: 0.5,
      }),
    },
  },
});

export const itemPinContainer = style(
  css({
    w: 8,
    d: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
);

export const itemPin = recipe({
  base: css({
    bgColor: 'gray.300',
    borderRadius: 'full',
    boxShadow: 'unset',
    w: 1.5,
    h: 1.5,
  }),
  variants: {
    isLarge: {
      true: css({
        w: 3,
        h: 3,
      }),
    },
    isActive: {
      true: css({
        bgColor: 'gray.500',
        boxShadow: `0 0 0 5px ${vars.colors.cyan['100']}`,
      }),
    },
    isFocused: {
      true: css({
        bgColor: 'gray.500',
      }),
    },
  },
});

export const itemRowText = style(
  css({
    flex: 1,
    color: 'gray.900',
    fontSize: 'xs',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }),
);

export const itemRowContainer = style(
  css({
    pos: 'relative',
  }),
);

export const itemRowInsertGutter = style(
  css({
    pos: 'absolute',
    top: 0,
    insetStart: 0,
    w: 'full',
    borderTop: '1px',
    borderColor: 'blue.700',
  }),
);
