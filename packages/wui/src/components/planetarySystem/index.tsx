import clsx from 'clsx';
import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { useBricks, useBrick } from '../../state/brick';

const PlanetaryListItem: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { brickId: string; isLived?: boolean }
> = ({ children, brickId, isLived, ...other }) => {
  const { focus } = useBrick(brickId);
  const onClick = useCallback(() => {
    focus();
  }, [focus]);

  return (
    <div
      {...other}
      {...{ onClick }}
      className={css`
        display: flex;
        align-items: center;
        height: 1.75rem;
        cursor: pointer;
        &:hover {
          background-color: var(--astr-colors-gray-100);
        }
      `}
    >
      <div
        className={css`
          width: 2rem;
          display: flex;
          justify-content: center;
          align-items: center;
        `}
      >
        <span
          className={clsx(
            css`
              background-color: var(--astr-colors-gray-300);
              border-radius: 50%;
            `,
            isLived
              ? css`
                  width: 0.75rem;
                  height: 0.75rem;
                `
              : css`
                  width: 0.375rem;
                  height: 0.375rem;
                `
          )}
        ></span>
      </div>
      <span
        className={css`
          flex: 1;
          color: var(--astr-colors-gray-700);
          font-size: var(--astr-fontSizes-sm);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        `}
      >
        {children}
      </span>
    </div>
  );
};

export const PlanetarySystem: React.VFC = () => {
  const { bricks } = useBricks();

  return (
    <div>
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
