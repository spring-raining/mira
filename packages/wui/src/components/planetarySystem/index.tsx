import { styled } from '@linaria/react';
import React, { useCallback } from 'react';
import { useBricks, useBrick } from '../../state/brick';
import { cssVar } from '../../theme';

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  height: 1.75rem;
  cursor: pointer;
  &:hover {
    background-color: ${cssVar('colors.gray.100')};
  }
`;
const ItemPinContainer = styled.div`
  width: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const ItemPin = styled.span<{ large?: boolean }>`
  background-color: ${cssVar('colors.gray.300')};
  border-radius: 50%;
  width: ${(props) => (props.large ? '0.75rem' : '0.375rem')};
  height: ${(props) => (props.large ? '0.75rem' : '0.375rem')};
`;
const ItemRowText = styled.span`
  flex: 1;
  color: ${cssVar('colors.gray.700')};
  font-size: ${cssVar('fontSizes.sm')};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const PlanetaryListItem: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { brickId: string; isLived?: boolean }
> = ({ children, brickId, isLived, ...other }) => {
  const { setActive } = useBrick(brickId);

  return (
    <ItemRow {...other} {...{ onClick: setActive }}>
      <ItemPinContainer>
        <ItemPin large={isLived} />
      </ItemPinContainer>
      <ItemRowText>{children}</ItemRowText>
    </ItemRow>
  );
};

export const PlanetarySystem: React.VFC = () => {
  const { bricks } = useBricks();
  const onClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div {...{ onClick }}>
      {bricks.map((brick) => (
        <PlanetaryListItem
          key={brick.brickId}
          brickId={brick.brickId}
          isLived={!!(brick.noteType === 'content' && brick.asteroid?.isLived)}
        >
          {brick.noteType === 'content' &&
            brick.language === 'markdown' &&
            brick.text}
        </PlanetaryListItem>
      ))}
    </div>
  );
};
