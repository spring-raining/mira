import { css, style, globalStyle } from '../../styles/system.css';

export const markdownStyling = style(
  css({
    d: 'flex',
    flexDir: 'column',
  }),
);
const mapSelector = (s: string) => s.replace(/&/g, markdownStyling);

globalStyle(
  mapSelector('& *'),
  css({
    fontFamily: 'body',
    color: 'gray.800',
    lineHeight: 'base',
    borderWidth: 0,
    borderStyle: 'solid',
    boxSizing: 'border-box',
    wordBreak: 'break-word',
  }),
);
globalStyle(
  mapSelector(`
    & blockquote,
    & dl,
    & dd,
    & h1,
    & h2,
    & h3,
    & h4,
    & h5,
    & h6,
    & hr,
    & figure,
    & p,
    & pre`),
  css({ m: 0 }),
);
globalStyle(
  mapSelector(`
    & pre,
    & code,
    & kbd,
    & samp`),
  css({
    fontFamily: 'mono',
    fontSize: 'md',
  }),
);
globalStyle(mapSelector('& p'), css({ my: 4 }));
globalStyle(
  mapSelector('& a'),
  css({
    cursor: 'pointer',
    textDecoration: 'none',
    outline: 'none',
    color: 'blue.500',
    wordWrap: 'break-word',
  }),
);
globalStyle(
  mapSelector('& a:hover'),
  css({
    textDecoration: 'underline',
  }),
);
globalStyle(
  mapSelector('& a:focus'),
  css({
    boxShadow: 'outline',
  }),
);
globalStyle(
  mapSelector('& hr'),
  css({
    boxSizing: 'content-box',
    height: 0,
    overflow: 'visible',
    borderTop: '1px',
    borderColor: 'current',
    my: 4,
  }),
);
globalStyle(
  mapSelector(`
    & h1,
    & h2,
    & h3,
    & h4,
    & h5,
    & h6`),
  css({
    fontFamily: 'heading',
    fontWeight: 'bold',
    lineHeight: 'shorter',
    my: 4,
  }),
);
globalStyle(
  mapSelector('& h1'),
  css({
    fontSize: '4xl',
  }),
);
globalStyle(
  mapSelector('& h2'),
  css({
    fontSize: '3xl',
  }),
);
globalStyle(
  mapSelector('& h3'),
  css({
    fontSize: '2xl',
  }),
);
globalStyle(
  mapSelector('& h4'),
  css({
    fontSize: 'xl',
  }),
);
globalStyle(
  mapSelector('& h5'),
  css({
    fontSize: 'lg',
  }),
);
globalStyle(
  mapSelector('& h6'),
  css({
    fontSize: 'md',
  }),
);
globalStyle(
  mapSelector('& blockquote'),
  css({
    w: 'full',
    d: 'block',
    p: 'relative',
    overflow: 'hidden',
    px: 4,
    py: 3,
    my: 4,
    bgColor: 'blackAlpha.100',
    borderRadius: 'lg',
  }),
);
globalStyle(
  mapSelector('& ul, & ol'),
  css({
    m: 0,
    p: 0,
    my: 2,
    ms: 4,
  }),
);
globalStyle(mapSelector('& table'), {
  fontVariantNumeric: 'lining-nums tabular-nums',
  borderCollapse: 'collapse',
  width: '100%',
});
globalStyle(
  mapSelector('& th'),
  css({
    fontFamily: 'heading',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 'wider',
    textAlign: 'start',
    px: 6,
    py: 3,
    fontSize: 'xs',
    lineHeight: 'short',
    borderBottom: '1px',
    borderColor: 'gray.100',
  }),
);
globalStyle(
  mapSelector('& tr:last-of-type th'),
  css({
    borderBottom: 'none',
  }),
);
globalStyle(
  mapSelector('& td'),
  css({
    textAlign: 'start',
    px: 6,
    py: 3,
    lineHeight: 'shorter',
    borderBottom: '1px',
    borderColor: 'gray.100',
  }),
);
globalStyle(mapSelector('& pre'), css({ my: 4 }));
globalStyle(
  mapSelector('& pre > code'),
  css({
    d: 'inline-block',
    fontSize: 'xs',
    lineHeight: 'short',
    w: 'full',
    px: 6,
    py: 4,
    bgColor: 'gray.100',
    borderRadius: 'lg',
    overflowX: 'auto',
  }),
);
globalStyle(
  mapSelector('& :not(pre) > code'),
  css({
    px: '0.2em',
    mx: 1,
    bgColor: 'gray.100',
    borderRadius: 'sm',
  }),
);
globalStyle(mapSelector('& img'), css({ maxW: 'full' }));
