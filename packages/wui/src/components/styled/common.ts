import { styled } from '@linaria/react';
import { cssVar } from '../../theme';

export const ErrorPreText = styled.pre`
  font-family: ${cssVar('fonts.mono')};
  font-size: ${cssVar('fontSizes.xs')};
  color: ${cssVar('colors.red.500')};
  white-space: pre-wrap;
  margin: 0;
`;
