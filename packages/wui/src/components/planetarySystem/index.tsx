import { styled } from '@linaria/react';
import React, {
  useCallback,
  useRef,
  useMemo,
  useEffect,
  useState,
} from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  background-color: ${cssVar('colors.white')};
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
const ItemRowContainer = styled.div`
  position: relative;
`;
const ItemRowInsertGutter = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  border-top: 1px solid ${cssVar('colors.blue.700')};
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

interface ListItemDragObject {
  brickIds: string[];
}

const PlanetaryListItem: React.FC<
  React.HTMLAttributes<HTMLDivElement> & {
    brickId: string;
    index: number;
    hasInsertGutter?: boolean;
    isLarge?: boolean;
    onHoverDragItem: (index: number) => void;
    onDropItem: (obj: ListItemDragObject) => void;
    onDragEnd: () => void;
  }
> = ({
  children,
  brickId,
  index,
  hasInsertGutter,
  isLarge,
  onHoverDragItem,
  onDropItem,
  onDragEnd,
  ...other
}) => {
  const { setActive, isActive, isFocused } = useBrick(brickId);
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop<ListItemDragObject, unknown, unknown>(
    () => ({
      accept: 'PlanetaryListItem',
      drop: (obj) => {
        onDropItem(obj);
      },
      hover: (_, monitor) => {
        if (!ref.current) {
          return;
        }
        const boundingRect = ref.current.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset()!;
        const hoverClientY = clientOffset.y - boundingRect.top;
        const dropIndex =
          hoverClientY > (boundingRect.bottom - boundingRect.top) / 2
            ? index + 1
            : index;
        onHoverDragItem(dropIndex);
      },
    }),
    [index, onDropItem, onHoverDragItem]
  );
  const [{ isDragging }, drag] = useDrag<
    ListItemDragObject,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      type: 'PlanetaryListItem',
      item: () => ({ brickIds: [brickId] }),
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
      end: () => {
        onDragEnd();
      },
    }),
    [onDragEnd]
  );

  // multiply ref
  drag(drop(ref));

  return (
    <ItemRowContainer {...other}>
      {hasInsertGutter && <ItemRowInsertGutter />}
      <ItemRow
        ref={ref}
        {...{ onClick: setActive }}
        style={{ opacity: isDragging ? 0.5 : undefined }}
      >
        <ItemPinContainer>
          <ItemPin
            isLarge={isLarge}
            isActive={isActive}
            isFocused={isFocused}
          />
        </ItemPinContainer>
        <ItemRowText>{children}</ItemRowText>
      </ItemRow>
    </ItemRowContainer>
  );
};

export const PlanetarySystem: React.VFC = () => {
  const { bricks, updateBrickOrder } = useBricks();
  const onClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);
  const { ref, marginTop } = useScrollAdjustSystem();
  const [hoverTargetIndex, setHoverTargetIndex] = useState<number | null>(null);
  const onHoverDragItem = useCallback((index: number) => {
    setHoverTargetIndex(index);
  }, []);
  const onDropItem = useCallback(
    ({ brickIds }: ListItemDragObject) => {
      const index = hoverTargetIndex;
      setHoverTargetIndex(null);
      if (index === null) {
        return;
      }
      const brickOrder = bricks.map((b) => b.brickId);
      updateBrickOrder([
        ...brickOrder.slice(0, index).filter((id) => !brickIds.includes(id)),
        ...brickIds,
        ...brickOrder.slice(index).filter((id) => !brickIds.includes(id)),
      ]);
    },
    [bricks, updateBrickOrder, hoverTargetIndex]
  );
  const onDragEnd = useCallback(() => {
    setHoverTargetIndex(null);
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <PlanetarySystemContainer {...{ ref, onClick }} style={{ marginTop }}>
        {bricks.map((brick, i) => (
          <PlanetaryListItem
            key={brick.brickId}
            brickId={brick.brickId}
            index={i}
            hasInsertGutter={i === hoverTargetIndex}
            isLarge={
              !!(brick.noteType === 'content' && brick.language !== 'markdown')
            }
            onHoverDragItem={onHoverDragItem}
            onDropItem={onDropItem}
            onDragEnd={onDragEnd}
          >
            {brick.noteType === 'content' &&
              brick.language === 'markdown' &&
              getMarkdownSubject(brick.children ?? [])}
          </PlanetaryListItem>
        ))}
      </PlanetarySystemContainer>
    </DndProvider>
  );
};
