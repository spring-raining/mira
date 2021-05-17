import { theme as defaultTheme } from '@chakra-ui/theme';

export const theme = {
  ...defaultTheme,
  config: {
    ...defaultTheme.config,
    cssVarPrefix: 'astr',
  },
};
