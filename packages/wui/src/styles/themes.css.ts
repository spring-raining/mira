import { theme as defaultTheme } from '@chakra-ui/react';
import {
  createGlobalTheme,
  createGlobalThemeContract,
} from '@vanilla-extract/css';
import { walkObject, CSSVarFunction } from '@vanilla-extract/private';
import cssesc from 'cssesc';

const {
  sizes,
  shadows,
  space,
  borders,
  transition,
  letterSpacings,
  lineHeights,
  fontWeights,
  fonts,
  fontSizes,
  breakpoints,
  zIndices,
  radii,
  direction,
  colors,
} = defaultTheme;

export const miraTheme = {
  sizes,
  shadows,
  space,
  borders,
  transition,
  letterSpacings,
  lineHeights,
  fontWeights,
  fonts,
  fontSizes,
  breakpoints,
  zIndices,
  radii,
  direction,
  colors: {
    transparent: colors.transparent,
    current: colors.current,
    white: colors.white,
    black: colors.black,
    whiteAlpha: colors.whiteAlpha,
    blackAlpha: colors.blackAlpha,
    gray: colors.gray,
    red: colors.red,
    orange: colors.orange,
    yellow: colors.yellow,
    green: colors.green,
    teal: colors.teal,
    blue: colors.blue,
    cyan: colors.cyan,
    purple: colors.purple,
    pink: colors.pink,
  },
} as const;

const renamedVars = createGlobalThemeContract(
  walkObject(
    miraTheme,
    // vanilla-extract only accepts string
    (value) => String(value)
  ),
  (_, path) => {
    const varName = cssesc(path.join('-').replace('.', '_'), {
      isIdentifier: true,
    });
    return `mira-${varName}`;
  }
);
export const vars = walkObject(
  renamedVars,
  (value) => String(value).replace('_', '\\.') as CSSVarFunction
);

createGlobalTheme(
  ':root',
  vars,
  walkObject(
    miraTheme,
    // vanilla-extract only accepts string
    (value) => String(value)
  )
);
