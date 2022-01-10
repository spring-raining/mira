import {
  extendTheme,
  toCSSObject,
  toCSSVar,
  CSSObject,
} from '@chakra-ui/react';
import type { StyleRule } from '@vanilla-extract/css';
import { miraTheme } from './themes.css';

export {
  style as defineStyle,
  globalStyle as defineGlobalStyle,
} from '@vanilla-extract/css';
export { recipe as defineRecipe } from '@vanilla-extract/recipes';

const theme = toCSSVar(
  extendTheme({ ...miraTheme, config: { cssVarPrefix: 'mira' } }),
);

export const css = (styles: CSSObject) =>
  toCSSObject({})({ theme, ...styles }) as StyleRule;
