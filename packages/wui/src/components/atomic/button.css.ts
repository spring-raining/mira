import { css, defineRecipe } from '../../styles/system.css';

const buttonColors = ['blue', 'red'] as const;

export const button = defineRecipe({
  base: {
    ...css({
      d: 'inline-flex',
      appearance: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
      pos: 'relative',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      outline: 'none',
      lineHeight: '1.2',
      borderRadius: 'md',
      fontWeight: 'semibold',
    }),
    ':focus': {
      boxShadow: 'outline',
    },
  },
  variants: {
    variant: {
      ghost: css({
        bg: 'transparent',
      }),
      outline: css({
        border: '1px',
        borderColor: 'current',
        bg: 'transparent',
      }),
      solid: css({}),
      link: {
        ...css({
          p: 0,
          h: 'auto',
          lineHeight: 'normal',
          verticalAlign: 'baseline',
        }),
        ':hover': css({
          textDecoration: 'underline',
        }),
      },
    },
    colorScheme: {
      blue: {},
      red: {},
    },
    size: {
      lg: css({
        h: 12,
        minW: 12,
        fontSize: 'lg',
        px: 6,
      }),
      md: css({
        h: 10,
        minW: 10,
        fontSize: 'md',
        px: 4,
      }),
      sm: css({
        h: 8,
        minW: 8,
        fontSize: 'sm',
        px: 3,
      }),
      xs: css({
        h: 6,
        minW: 6,
        fontSize: 'xs',
        px: 2,
      }),
    },
  },
  compoundVariants: buttonColors.flatMap((color) => [
    {
      variants: {
        variant: 'ghost',
        colorScheme: color,
      },
      style: {
        ':hover': css({
          bg: `${color}.50`,
          color: `${color}.500`,
        }),
        ':active': css({
          bg: `${color}.100`,
          color: `${color}.500`,
        }),
      },
    },
    {
      variants: {
        variant: 'outline',
        colorScheme: color,
      },
      style: {
        ...css({
          color: `${color}.600`,
        }),
        ':hover': css({
          bg: `${color}.50`,
        }),
        ':active': css({
          bg: `${color}.100`,
        }),
      },
    },
    {
      variants: {
        variant: 'solid',
        colorScheme: color,
      },
      style: {
        ...css({
          bg: `${color}.500`,
          color: 'white',
        }),
        ':hover': css({
          bg: `${color}.600`,
        }),
        ':active': css({
          bg: `${color}.700`,
        }),
      },
    },
    {
      variants: {
        variant: 'link',
        colorScheme: color,
      },
      style: {
        ...css({
          color: `${color}.500`,
        }),
        ':active': css({
          color: `${color}.700`,
        }),
      },
    },
  ]),
});

export const iconButton = defineRecipe({
  base: css({
    p: 0,
  }),
  variants: {
    isRound: {
      true: css({
        borderRadius: 'full',
      }),
    },
  },
});
