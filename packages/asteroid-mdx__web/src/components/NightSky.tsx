import React from 'react';
import { useColorMode, BoxProps } from '@chakra-ui/core';
import styled from '@emotion/styled';
import * as UI from './ui';

export const StyledNightSky = styled(UI.Box)<{
  colorMode: 'light' | 'dark';
}>(({ colorMode }) => {
  const hsl = colorMode === 'light' ? '0,0%,100%' : '220,26%,14%';
  const orbit = 'rgba(255,255,255,0.2)';
  return {
    position: 'relative',
    background: `
    radial-gradient(circle at 100% -20%, transparent 20rem, ${orbit} 20rem, ${orbit} calc(20rem + 1px), transparent calc(20rem + 1px)),
    radial-gradient(ellipse at top left, #00031f, rgba(0, 17, 64, 0.9) 50%, transparent),
    radial-gradient(ellipse at top right, #25006f, #7330ff 83%)`,
    color: 'white',
    '::after': {
      content: '""',
      position: 'absolute',
      height: '30%',
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(
        to bottom,
        hsla(${hsl}, 0) 0%,
        hsla(${hsl}, 0.013) 6.5%,
        hsla(${hsl}, 0.049) 12.8%,
        hsla(${hsl}, 0.104) 19%,
        hsla(${hsl}, 0.175) 25.2%,
        hsla(${hsl}, 0.259) 31.3%,
        hsla(${hsl}, 0.352) 37.4%,
        hsla(${hsl}, 0.45) 43.5%,
        hsla(${hsl}, 0.55) 49.8%,
        hsla(${hsl}, 0.648) 56.2%,
        hsla(${hsl}, 0.741) 62.7%,
        hsla(${hsl}, 0.825) 69.6%,
        hsla(${hsl}, 0.896) 76.6%,
        hsla(${hsl}, 0.951) 84%,
        hsla(${hsl}, 0.987) 91.8%,
        hsl(${hsl}) 100%
      )`,
    },
  };
});

export const NightSky: React.FC<BoxProps> = ({ children, ...other }) => {
  const { colorMode } = useColorMode();
  return (
    <StyledNightSky colorMode={colorMode} w="100%" py={12} {...other}>
      {children}
    </StyledNightSky>
  );
};
