import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useVirtual, VirtualItem } from 'react-virtual';
import { useInViewBrickState } from '../../hooks/useInViewState';
import { usePrevState } from '../../hooks/usePrevState';
import { useBricks } from '../../state/brick';
import { Block } from './Block';
import * as style from './ScrollableBlockList.css';

// ref. https://github.com/olahol/scrollparent.js
const getScrollParent = (element: HTMLElement | null): HTMLElement => {
  const regex = /(auto|scroll)/;
  const isScrollable = (node: Element) => {
    const styles = getComputedStyle(node);
    return regex.test(
      `${styles.overflow}${styles.overflowX}${styles.overflowY}`,
    );
  };
  let node: HTMLElement | null = element;
  while (node && node !== document.body) {
    if (isScrollable(node)) {
      return node;
    }
    node = node.parentElement;
  }
  return document.body;
};

const usePurgedVirtualItem = (virtualItems: VirtualItem[]) => {
  const virtualItemDiff = usePrevState(virtualItems);
  const purgedItemKeyRef = useRef(new Set<string | number>());

  useEffect(() => {
    const [next, prev] = virtualItemDiff;
    const nextKey = next.map((it) => it.key);
    const prevKey = (prev || []).map((it) => it.key);
    nextKey
      .filter((key) => !prevKey.includes(key))
      .forEach((key) => purgedItemKeyRef.current.delete(key));
    prevKey
      .filter((key) => !nextKey.includes(key))
      .forEach((key) => purgedItemKeyRef.current.add(key));
  }, [virtualItemDiff]);

  return purgedItemKeyRef;
};

export const ScrollableBlockList: React.VFC<{
  onUpdateMdx?: (mdx: string) => void;
}> = ({ onUpdateMdx }) => {
  const { bricks } = useBricks({ onUpdateMdx });
  const contentsRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    parentRef.current = getScrollParent(contentsRef.current);
  }, []);

  const cachedSizeRef = useRef(new Map<string | number, number>());
  const elementKeyMap = useRef(new WeakMap<HTMLElement, string | number>());

  const virtualizer = useVirtual({
    size: bricks.length,
    parentRef,
    overscan: 4,
    scrollOffsetFn: useCallback(() => {
      const offsetTop = contentsRef.current?.offsetTop ?? 0;
      return parentRef.current ? parentRef.current.scrollTop - offsetTop : 0;
    }, []),
    estimateSize: useCallback(() => 400, []),
    keyExtractor: (index) => bricks[index].id,
    // missing measureSize typedef https://github.com/TanStack/react-virtual/pull/190
    ...{
      measureSize: useCallback((el: HTMLElement) => {
        const key = elementKeyMap.current.get(el);
        if (key && purgedItemKeyRef.current.has(key)) {
          return cachedSizeRef.current.get(key);
        }
        return el.offsetHeight;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []),
    },
  });

  const purgedItemKeyRef = usePurgedVirtualItem(virtualizer.virtualItems);
  const virtualItems = useMemo(
    () =>
      virtualizer.virtualItems.map((item) => {
        return {
          ...item,
          // wrap original measureRef and capture size before the measurement
          measureRef: (el: HTMLElement | null) => {
            if (el) {
              elementKeyMap.current.set(el, item.key);
              if (!purgedItemKeyRef.current.has(item.key)) {
                cachedSizeRef.current.set(item.key, el.offsetHeight);
              }
            }
            return item.measureRef(el);
          },
        };
      }),
    [virtualizer.virtualItems, purgedItemKeyRef],
  );

  const { updateInViewState } = useInViewBrickState();
  useEffect(() => {
    updateInViewState(virtualItems.map((it) => it.key as string));
  }, [virtualItems, updateInViewState]);

  return (
    <div ref={contentsRef} className={style.listContainer}>
      {bricks.map((brick) => {
        const row = virtualItems.find((row) => row.key === brick.id);
        return (
          <div key={brick.id} className={style.listItem}>
            <Block inView={!!row} ref={row && row.measureRef} {...brick} />
          </div>
        );
      })}
    </div>
  );
};
