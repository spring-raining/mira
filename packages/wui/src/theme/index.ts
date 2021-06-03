import { theme as defaultTheme, ChakraTheme } from '@chakra-ui/theme';
import { toCSSVar } from '@chakra-ui/react';

export const theme: ChakraTheme = {
  ...defaultTheme,
  config: {
    ...defaultTheme.config,
    cssVarPrefix: 'mira',
  },
};

const cssVarObj = toCSSVar(theme);

export type CssVarName = `${keyof typeof cssVarObj}.${string}`;
export const cssVar = (cssVarName: CssVarName): string => {
  return cssVarObj.__cssMap[cssVarName].varRef;
};
