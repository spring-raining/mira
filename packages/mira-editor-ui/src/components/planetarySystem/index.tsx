import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useUniverseContext } from '../../context';
import { getMarkdownSubject } from '../../mdx/util';
import { useBricks, useBrick } from '../../state/brick';
import { BrickId } from '../../types';
import * as style from './planetarySystem.css';

const useScrollAdjustSystem = () => {
  const { __cache } = useUniverseContext();
  const { brickOrder } = useBricks();
  const ref = useRef<HTMLDivElement>(null);
  const [marginTop, setMarginTop] = useState(0);

  const [displayPos, setDisplayPos] = useState(0);
  useEffect(() => {
    const fn = () => {
      const inViewIndex = [...__cache.current.inViewState]
        .map((id) => brickOrder.findIndex((i) => id === i))
        .filter((index) => index >= 0);
      const first = Math.min(...inViewIndex);
      const last = brickOrder.length - Math.max(...inViewIndex) - 1;
      setDisplayPos(first / (first + last));
    };
    window.addEventListener('wheel', fn, { passive: true });
    return () => window.removeEventListener('wheel', fn);
  }, [brickOrder, __cache]);

  useEffect(() => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const adjustSize = (rect.height - window.innerHeight + 140) * displayPos;
    if (Number.isFinite(adjustSize)) {
      setMarginTop(Math.min(0, -adjustSize));
    }
  }, [displayPos]);

  return { ref, marginTop };
};

interface ListItemDragObject {
  brickIds: BrickId[];
}

const PlanetaryListItem: React.FC<{
  brickId: BrickId;
  index: number;
  hasInsertGutter?: boolean;
  isLarge?: boolean;
  onHoverDragItem: (index: number) => void;
  onDropItem: (obj: ListItemDragObject) => void;
  onDragEnd: () => void;
  onSelect: (brickId: BrickId) => void;
  onRangeSelect: (brickId: BrickId) => void;
  onMultipleSelect: (brickId: BrickId) => void;
}> = ({
  children,
  brickId,
  index,
  hasInsertGutter,
  isLarge,
  onHoverDragItem,
  onDropItem,
  onDragEnd,
  onSelect,
  onRangeSelect,
  onMultipleSelect,
}) => {
  const { setActive, isActive, isFocused, isSelected } = useBrick(brickId);
  const ref = useRef<HTMLDivElement>(null);
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.metaKey) {
        onMultipleSelect(brickId);
        return;
      } else if (e.shiftKey) {
        onRangeSelect(brickId);
        return;
      }
      onSelect(brickId);
      setActive();
    },
    [brickId, onSelect, onRangeSelect, onMultipleSelect, setActive],
  );
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
    [index, onDropItem, onHoverDragItem],
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
    [onDragEnd],
  );

  // multiply ref
  drag(drop(ref));

  return (
    <div className={style.itemRowContainer}>
      {hasInsertGutter && <div className={style.itemRowInsertGutter} />}
      <div
        ref={ref}
        className={style.itemRow({ isSelected, isDragging })}
        {...{ onClick }}
      >
        <div className={style.itemPinContainer}>
          <span className={style.itemPin({ isLarge, isActive, isFocused })} />
        </div>
        <span className={style.itemRowText}>{children}</span>
      </div>
    </div>
  );
};

export const PlanetarySystem: React.VFC = () => {
  const { bricks, selectedBrickIds, updateBrickOrder, setSelectedBrickIds } =
    useBricks();
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
      const brickOrder = bricks.map((b) => b.id);
      const draggingBrickIds =
        selectedBrickIds.length > 0
          ? brickOrder.filter((id) => selectedBrickIds.includes(id))
          : brickIds;
      updateBrickOrder([
        ...brickOrder
          .slice(0, index)
          .filter((id) => !draggingBrickIds.includes(id)),
        ...draggingBrickIds,
        ...brickOrder
          .slice(index)
          .filter((id) => !draggingBrickIds.includes(id)),
      ]);
    },
    [bricks, selectedBrickIds, updateBrickOrder, hoverTargetIndex],
  );
  const onDragEnd = useCallback(() => {
    setHoverTargetIndex(null);
  }, []);
  const [lastSelectId, setLastSelectId] = useState<string | null>(null);
  const onSelect = useCallback(
    (brickId: BrickId) => {
      setLastSelectId(brickId);
      setSelectedBrickIds([brickId]);
    },
    [setSelectedBrickIds],
  );
  const onRangeSelect = useCallback(
    (brickId: BrickId) => {
      const a = bricks.findIndex((b) => b.id === lastSelectId);
      const b = bricks.findIndex((b) => b.id === brickId);
      const selectedIds = bricks
        .slice(Math.min(a, b), Math.max(a, b) + 1)
        .map((b) => b.id);
      setSelectedBrickIds(selectedIds);
    },
    [bricks, lastSelectId, setSelectedBrickIds],
  );
  const onMultipleSelect = useCallback(
    (brickId: BrickId) => {
      setSelectedBrickIds((selectedIds) =>
        selectedIds.includes(brickId)
          ? selectedIds.filter((id) => id !== brickId)
          : [...selectedIds, brickId],
      );
    },
    [setSelectedBrickIds],
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        {...{ ref, onClick }}
        className={style.planetarySystemContainer}
        style={{ transform: `translateY(${marginTop}px)` }}
      >
        {bricks.map((brick, i) => (
          <PlanetaryListItem
            key={brick.id}
            brickId={brick.id}
            index={i}
            hasInsertGutter={i === hoverTargetIndex}
            isLarge={!!(brick.type === 'snippet')}
            {...{
              onHoverDragItem,
              onDropItem,
              onDragEnd,
              onSelect,
              onRangeSelect,
              onMultipleSelect,
            }}
          >
            {brick.type === 'note' && getMarkdownSubject(brick.ast ?? [])}
          </PlanetaryListItem>
        ))}
      </div>
    </DndProvider>
  );
};
