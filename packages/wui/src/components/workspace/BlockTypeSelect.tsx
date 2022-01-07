import React, { useState, useCallback } from 'react';
import { CodeIcon, FunctionIcon, MenuAlt2Icon } from '../icon';

// const SelectContainer = styled.div`
//   position: relative;
//   width: 14rem;
//   height: 2rem;
// `;

// const SelectButtonStack = styled.div<{ placementIndex: number }>`
//   position: absolute;
//   left: 0;
//   width: 100%;
//   top: ${(props) => -2.25 * props.placementIndex}rem;
//   margin: -0.125rem 0;
//   display: flex;
//   flex-direction: column;
// `;

// const SelectButton = styled.button<{ active?: boolean; visible?: boolean }>`
//   height: 2rem;
//   margin: 0.125rem 0;
//   padding: 0 0.25rem;
//   display: ${(props) => (props.visible ? 'inline-flex' : 'none')};
//   appearance: none;
//   justify-content: start;
//   align-items: center;
//   user-select: none;
//   outline: none;
//   cursor: pointer;
//   color: ${(props) =>
//     props.active ? cssVar('colors.white') : cssVar('colors.blue.500')};
//   font-size: ${cssVar('fontSizes.sm')};
//   background: ${(props) =>
//     props.active ? cssVar('colors.blue.500') : cssVar('colors.white')};
//   border: 1px solid ${cssVar('colors.blue.500')};
//   border-radius: 2rem;
//   &:hover {
//     color: ${cssVar('colors.white')};
//     background: ${cssVar('colors.blue.500')};
//   }
// `;

// const selectButtonAppearAnim = css`
//   animation: appear 0.05s ease-out 1;
//   @keyframes appear {
//     from {
//       transform: translateY(4px);
//     }
//     to {
//       transform: translateY(0);
//     }
//   }
// `;

const iconStyle = '';
// const iconStyle = css`
//   height: 1.125rem;
//   margin: 0 0.25rem;
// `;

type BlockType = 'note' | 'snippet' | 'script';

export const BlockTypeSelect: React.VFC<{
  value: BlockType;
  // placeCenterFor?: BlockType;
  onChange?: (value: BlockType) => void;
}> = ({ value, onChange = () => {} }) => {
  const [placeCenterFor, setPlaceCenterFor] = useState(() => value);
  const [isMouseEntered, setIsMouseEntered] = useState(false);
  const selectContainerCallbacks = {
    onMouseEnter: useCallback(() => setIsMouseEntered(true), []),
    onMouseLeave: useCallback(() => {
      setIsMouseEntered(false);
      setPlaceCenterFor(value);
    }, [value]),
  };
  const onSelectButtonClick = {
    note: useCallback(() => onChange('note'), [onChange]),
    snippet: useCallback(() => onChange('snippet'), [onChange]),
    script: useCallback(() => onChange('script'), [onChange]),
  };

  return (
    <div {...selectContainerCallbacks}>
      <div
      // placementIndex={
      //   !isMouseEntered
      //     ? 0
      //     : placeCenterFor === 'script'
      //     ? 2
      //     : placeCenterFor === 'snippet'
      //     ? 1
      //     : 0
      // }
      >
        <button
          // active={value === 'note'}
          // visible={value === 'note' || isMouseEntered}
          // className={value !== 'note' ? selectButtonAppearAnim : undefined}
          onClick={onSelectButtonClick.note}
        >
          <MenuAlt2Icon className={iconStyle} />
          Note
        </button>
        <button
          // active={value === 'snippet'}
          // visible={value === 'snippet' || isMouseEntered}
          // className={value !== 'snippet' ? selectButtonAppearAnim : undefined}
          onClick={onSelectButtonClick.snippet}
        >
          <CodeIcon className={iconStyle} />
          Snippet
        </button>
        <button
          // active={value === 'script'}
          // visible={value === 'script' || isMouseEntered}
          // className={value !== 'script' ? selectButtonAppearAnim : undefined}
          onClick={onSelectButtonClick.script}
        >
          <FunctionIcon className={iconStyle} />
          Script
        </button>
      </div>
    </div>
  );
};
