import { nanoid } from 'nanoid';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

const usePortalTarget = ({ id }: { id: string }) => {
  const rootEl = useRef<HTMLDivElement | null>(null);
  const getRootEl = () => {
    if (!rootEl.current) {
      rootEl.current = document.createElement('div');
    }
    return rootEl.current;
  };

  useEffect(() => {
    if (!window) {
      return;
    }
    const rootContainer = (() => {
      const existing = document.getElementById(id);
      if (existing) {
        return existing;
      }
      const el = document.createElement('div');
      el.setAttribute('id', id);
      return el;
    })();
    document.body.insertBefore(
      rootContainer,
      document.body.lastElementChild!.nextElementSibling,
    );
    rootContainer.appendChild(getRootEl());
    return () => {
      rootEl.current?.remove();
      if (!rootContainer.childElementCount) {
        rootContainer.remove();
      }
    };
  }, [id]);

  return window && getRootEl();
};

export const PopperPortal: React.FC<{
  popperOptions?: Parameters<typeof usePopper>[2];
}> = ({ children, popperOptions }) => {
  const id = useRef(nanoid());
  const target = usePortalTarget({ id: id.current });
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const { styles, attributes } = usePopper(
    referenceElement,
    popperElement,
    popperOptions,
  );

  return (
    <div ref={setReferenceElement}>
      {createPortal(
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          {children}
        </div>,
        target,
      )}
    </div>
  );
};
