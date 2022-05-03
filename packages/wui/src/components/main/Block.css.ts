import {
  css,
  defineStyle,
  defineGlobalStyle,
  defineRecipe,
} from '../../styles/system.css';
import { vars } from '../../styles/themes.css';
import { displayColumn } from './../Universe.css';

export const blockContainer = defineStyle([
  css({
    pos: 'relative',
    my: -10,
    d: 'grid',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridTemplateColumns: `${vars.sizes['10']} 1fr`,
        gridTemplateRows: `${vars.sizes['10']} auto auto ${vars.sizes['10']}`,
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridTemplateColumns: `${vars.sizes['10']} 1fr 1fr`,
        gridTemplateRows: `${vars.sizes['10']} auto ${vars.sizes['10']}`,
      }),
    },
  },
]);

export const blockVirtualRefArea = defineStyle([
  css({
    position: 'relative',
    pointerEvents: 'none',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '1 / 2 / span 3 / auto',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '1 / 2 / span 2 / span 2',
      }),
    },
  },
]);

export const editorArea = defineStyle([
  css({
    position: 'relative',
    maxW: 'xl',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '2 / 2',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '2 / 2',
      }),
    },
  },
]);

export const notePreviewArea = defineStyle([
  css({
    position: 'relative',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '2 / 2 / span 2 / auto',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '2 / 2 / auto / span 2',
      }),
    },
  },
]);

export const livePreviewArea = defineStyle([
  css({
    position: 'relative',
    pointerEvents: 'none',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '3 / 2',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '2 / 3',
      }),
    },
  },
]);
defineGlobalStyle(
  `${livePreviewArea} > *`,
  css({
    pointerEvents: 'auto',
  }),
);

export const topToolbarArea = defineStyle([
  css({
    position: 'relative',
    borderBottom: '2px',
    borderColor: 'gray.200',
    d: 'flex',
    alignItems: 'flex-end',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '1 / 2',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '1 / 2 / auto / span 2',
      }),
    },
  },
]);

export const contentLeftHandleArea = defineStyle([
  css({
    position: 'relative',
    d: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
  }),
  {
    ':before': {
      content: '""',
      ...css({
        d: 'block',
        w: 0,
        borderLeft: '4px dashed',
        borderColor: 'gray.200',
      }),
    },
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '2 / 1 / span 2',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '2 / 1',
      }),
    },
  },
]);

export const topLeftArea = defineStyle([
  css({
    position: 'relative',
    gridArea: '1 / 1',
    d: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '1 / 1',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '1 / 1',
      }),
    },
  },
]);

export const bottomLeftArea = defineStyle([
  css({
    position: 'relative',
    gridArea: '3 / 1',
    d: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  }),
  {
    selectors: {
      [`${displayColumn.oneColumn} &`]: css({
        gridArea: '4 / 1',
      }),
      [`${displayColumn.twoColumn} &`]: css({
        gridArea: '3 / 1',
      }),
    },
  },
]);

export const topSticky = defineStyle(
  css({
    w: 'full',
    pos: 'sticky',
    top: 0,
  }),
);

export const topToolPart = defineStyle(
  css({
    pos: 'absolute',
    top: -8,
    left: '-1.125rem',
    w: '50%',
    h: 8,
    d: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
);

export const middleToolContainer = defineRecipe({
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

export const editorContainer = defineRecipe({
  base: css({
    w: 'full',
    borderBottomRadius: 'md',
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

export const livePreviewContainer = defineStyle(
  css({
    w: 'full',
    p: 4,
    borderRadius: 'md',
    bgColor: 'white',
  }),
);

export const scriptPreviewContainer = defineStyle([
  css({
    w: 'full',
    my: -4,
    py: 4,
    /* Align with Editor size */
    ps: '26px',
    minH: 16,
    maxW: 'xl',
  }),
]);
defineGlobalStyle(
  `${scriptPreviewContainer} pre`,
  css({
    my: '16px',
  }),
);

export const scriptPreviewCode = defineStyle({});
defineGlobalStyle(
  `${scriptPreviewCode} *`,
  css({
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'shorter',
  }),
);
defineGlobalStyle(
  `${scriptPreviewCode} div`,
  css({
    height: '18px',
  }),
);

export const markdownPreviewContainer = defineStyle(
  css({
    px: 4,
    py: 4,
    minH: 16,
    maxW: 'xl',
    d: 'flex',
    flexDir: 'column',
    boxSizing: 'borderjbox',
  }),
);

export const noContentParagraph = defineStyle(
  css({
    color: 'gray.400',
  }),
);

export const bottomToolPart = defineStyle(
  css({
    pos: 'absolute',
    bottom: -8,
    left: '-1.125rem',
    w: '50%',
    h: 8,
    d: 'flex',
    alignItems: 'center',
  }),
);

export const middleToolHandler = defineStyle(
  css({
    pos: 'absolute',
    insetY: 0,
    left: '-1.125rem',
    w: 8,
  }),
);

export const toolbarHolder = defineStyle(
  css({
    pos: 'relative',
    top: -7,
  }),
);

export const errorPreText = defineRecipe({
  base: css({
    fontFamily: 'mono',
    fontSize: 'xs',
    color: 'red.500',
    whiteSpace: 'pre-wrap',
  }),
  variants: {
    errorType: {
      scriptError: css({
        color: 'red.500',
      }),
      parseError: css({
        color: 'cyan.700',
      }),
    },
  },
});

export const debuggerContainer = defineStyle(
  css({
    position: 'absolute',
    zIndex: 1000,
    bottom: 0,
    right: 0,
    width: 64,
    padding: 2,
    fontSize: '9px',
    backgroundColor: 'whiteAlpha.700',
    border: '1px',
    borderColor: 'gray.300',
    borderRadius: 2,
    pointerEvents: 'none',
  }),
);
