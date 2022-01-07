import { css, style, globalStyle, recipe } from '../../styles/system.css';

export const iconButton = recipe({
  base: [
    css({
      d: 'inline-block',
      appearance: 'none',
      justifyContent: 'center',
      alignItems: 'center',
      userSelect: 'none',
      outline: 'none',
      cursor: 'pointer',
      bg: 'transparent',
      borderWidth: 0,
      borderRadius: 'md',
      fontWeight: 'semibold',
      h: 6,
      minW: 10,
      fontSize: 'md',
      color: 'inherit',
    }),
    {
      ':focus': css({
        boxShadow: 'outline',
      }),
    },
  ],
  variants: {
    colorScheme: {
      blue: {
        ':hover': css({
          color: 'blue.500',
        }),
      },
      red: {
        ':hover': css({
          color: 'red.500',
        }),
      },
    },
  },
});

export const blockContainer = style(
  css({
    pos: 'relative',
    my: 8,
    pointerEvents: 'none',
  })
);

export const topToolPart = style(
  css({
    pos: 'absolute',
    top: -8,
    left: '-1.125rem',
    w: '50%',
    h: 8,
    d: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  })
);

export const middleToolContainer = recipe({
  base: css({
    pos: 'relative',
    w: 'full',
    my: 8,
    d: 'flex',
    borderLeft: '4px dashed',
    borderColor: 'transparent',
  }),
  variants: {
    isActive: {
      true: css({
        borderColor: 'gray.200',
      }),
    },
  },
});

export const editorStickyArea = style(
  css({
    pos: 'absolute',
    inset: 0,
    d: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  })
);

export const editorPart = style(
  css({
    w: '50%',
    pos: 'sticky',
    top: 0,
    pointerEvents: 'auto',
  })
);

export const editorContainer = recipe({
  base: css({
    pos: 'absolute',
    top: 0,
    insetX: 4,
    borderRadius: 'md',
    borderTopStartRadius: 0,
    bgColor: 'gray.50',
  }),
  variants: {
    isActive: {
      true: css({
        bgColor: 'gray.100',
      }),
    },
  },
});

export const livePreviewStickyArea = style(
  css({
    pos: 'relative',
    w: 'full',
    my: -8,
    py: 8,
    alignSelf: 'stretch',
    d: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    bgColor: 'gray.50',
  })
);

export const livePreviewPart = style(
  css({
    w: 'full',
    ps: 6,
  })
);

export const livePreviewContainer = style(
  css({
    w: 'full',
    p: 4,
    border: '2px',
    borderColor: 'inherit',
    borderRadius: 'base',
    boxSizing: 'border-box',
    bgColor: 'white',
  })
);

export const previewPart = style(
  css({
    pos: 'relative',
    top: 0,
    w: 'full',
    d: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    pointerEvents: 'auto',
  })
);

export const scriptPreviewContainer = style([
  css({
    w: 'full',
    mx: 4,
    /* Align with Editor size */
    paddingLeft: '26px',
  }),
]);
globalStyle(
  `${scriptPreviewContainer} pre`,
  css({
    my: '16px',
  })
);

export const scriptPreviewCode = style({});
globalStyle(
  `${scriptPreviewCode} *`,
  css({
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: 'base',
  })
);
globalStyle(
  `${scriptPreviewCode} div`,
  css({
    height: '18px',
  })
);

export const markdownPreviewContainer = style(
  css({
    w: 'full',
    mx: 10,
    my: -2,
    minH: 16,
    d: 'flex',
    flexDir: 'column',
    boxSizing: 'borderjbox',
  })
);

export const noContentParagraph = style(
  css({
    color: 'gray.400',
  })
);

export const bottomToolPart = style(
  css({
    pos: 'absolute',
    bottom: -8,
    left: '-1.125rem',
    w: '50%',
    h: 8,
    d: 'flex',
    alignItems: 'center',
    pointerEvents: 'auto',
  })
);

export const middleToolHandler = style(
  css({
    pos: 'absolute',
    insetY: 0,
    left: '-1.125rem',
    w: 8,
    pointerEvents: 'auto',
  })
);

export const toolbarHolder = style(
  css({
    pos: 'relative',
    top: -7,
  })
);

export const toolbar = style(
  css({
    w: '18rem',
    h: 9,
    ps: 1,
    pe: 3,
    borderRadius: '2xl',
    d: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    bgColor: 'white',
    boxShadow: 'md',
    pointerEvents: 'auto',
  })
);
