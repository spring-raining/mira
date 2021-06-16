import { styled } from '@linaria/react';
import React, {
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useState,
} from 'react';
import { getMarkdownSubject } from '../../mdx/util';
import { useBricks, useBrick, useInViewBrickState } from '../../state/brick';
import { cssVar } from '../../theme';

const PlanetarySystemContainer = styled.div`
  transition: all 200ms ease;
`;
const ItemRow = styled.div`
  display: flex;
  align-items: center;
  height: 1.5rem;
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
const ItemPin = styled.span<{
  isLarge?: boolean;
  isActive?: boolean;
  isFocused?: boolean;
}>`
  background-color: ${(props) =>
    props.isFocused || props.isActive
      ? cssVar('colors.gray.500')
      : cssVar('colors.gray.300')};
  border-radius: 50%;
  box-shadow: ${(props) =>
    props.isActive ? `0 0 0 5px ${cssVar('colors.cyan.100')}` : 'unset'};
  width: ${(props) => (props.isLarge ? '0.75rem' : '0.375rem')};
  height: ${(props) => (props.isLarge ? '0.75rem' : '0.375rem')};
`;
const ItemRowText = styled.span`
  flex: 1;
  color: ${cssVar('colors.gray.900')};
  font-size: ${cssVar('fontSizes.xs')};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const useScrollAdjustSystem = () => {
  const { bricks } = useBricks();
  const { inViewBrickIds } = useInViewBrickState();
  const ref = useRef<HTMLDivElement>(null);
  const [marginTop, setMarginTop] = useState(0);

  const displayPos = useMemo(() => {
    const inViewIndex = inViewBrickIds
      .map((id) => bricks.findIndex((brick) => id === brick.brickId))
      .filter((index) => index >= 0);
    const first = Math.min(...inViewIndex);
    const last = bricks.length - Math.max(...inViewIndex) - 1;
    return first / (first + last);
  }, [bricks, inViewBrickIds]);
  useEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const adjustSize = (rect.height - window.innerHeight + 140) * displayPos;
    setMarginTop(Math.min(0, -adjustSize));
  }, [displayPos]);

  return { ref, marginTop };
};

const PlanetaryListItem: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    brickId: string;
    isLarge?: boolean;
  }
> = ({ children, brickId, isLarge, ...other }) => {
  const { setActive, isActive, isFocused } = useBrick(brickId);

  return (
    <ItemRow {...other} {...{ onClick: setActive }}>
      <ItemPinContainer>
        <ItemPin isLarge={isLarge} isActive={isActive} isFocused={isFocused} />
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
  const { ref, marginTop } = useScrollAdjustSystem();

  return (
    <PlanetarySystemContainer {...{ ref, onClick }} style={{ marginTop }}>
      {bricks.map((brick) => (
        <PlanetaryListItem
          key={brick.brickId}
          brickId={brick.brickId}
          isLarge={
            !!(brick.noteType === 'content' && brick.language !== 'markdown')
          }
        >
          {brick.noteType === 'content' &&
            brick.language === 'markdown' &&
            getMarkdownSubject(brick.children ?? [])}
        </PlanetaryListItem>
      ))}
    </PlanetarySystemContainer>
  );
};
