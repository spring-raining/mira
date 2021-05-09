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
          background-color: #edf2f7;
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
          className={[
            css`
              background-color: #cbd5e0;
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
                `,
          ].join(' ')}
        ></span>
      </div>
      <span
        className={css`
          flex: 1;
          color: #4a5568;
          font-size: 0.875rem;
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
