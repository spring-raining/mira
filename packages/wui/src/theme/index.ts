import { theme as defaultTheme } from '@chakra-ui/theme';
import { toCSSVar } from '@chakra-ui/react';

export const theme = {
  ...defaultTheme,
  config: {
    ...defaultTheme.config,
    cssVarPrefix: 'astr',
  },
};

const cssVarObj = toCSSVar(theme);

export type CssVarName = `${keyof typeof cssVarObj}.${string}`;
export const cssVar = (cssVarName: CssVarName): string => {
  return cssVarObj.__cssMap[cssVarName].varRef;
};
