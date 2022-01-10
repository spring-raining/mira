import React, { useCallback, useState } from 'react';
import { useBrick, useBrickManipulator } from '../../state/brick';
import { Brick } from '../../types';
import { IconButton } from '../atomic/button';
import { Menu, MenuButton, MenuList, MenuItem } from '../atomic/menu';
import { CodeIcon } from '../icon/code';
import { MenuAlt2Icon } from '../icon/menuAlt2';
import { TrashIcon } from '../icon/trash';
import * as style from './BlockToolbar.css';
import { LanguageCompletionForm } from './LanguageCompletionForm';

export const BlockToolbar: React.VFC<{
  id: string;
}> = ({ id }) => {
  const { brick, updateTrait, setActive, isActive } = useBrick(id);
  const { cleanup } = useBrickManipulator();
  const [brickType, setBrickType] = useState(() => brick.type);
  const deleteBrick = useCallback(() => {
    cleanup(id);
  }, [cleanup, id]);
  const handleChangeBlockType = {
    note: useCallback(() => {
      updateTrait({ type: 'note' });
    }, [updateTrait]),
    snippet: useCallback(() => {
      updateTrait({ type: 'snippet' });
    }, [updateTrait]),
  };
  const handleChangeEditingLanguage = useCallback(
    (lang: string) => {
      setBrickType(
        lang.trim() ? 'snippet' : brick.type === 'script' ? 'script' : 'note',
      );
    },
    [brick.type],
  );
  const handleChangeLanguage = useCallback(
    (language: string) => {
      updateTrait({ language, type: brickType });
    },
    [brickType, updateTrait],
  );

  return (
    <div className={style.toolbar}>
      <LanguageCompletionForm
        language={brick.type === 'snippet' ? brick.language : ''}
        onChange={handleChangeEditingLanguage}
        onSubmit={handleChangeLanguage}
        onFocus={setActive}
        isActive={isActive}
        rightElement={
          <div className={style.toolbarRightContainer}>
            <Menu>
              <MenuButton variant="ghost" size="xs">
                {brickType === 'snippet' ? <CodeIcon /> : <MenuAlt2Icon />}
              </MenuButton>
              <MenuList>
                <MenuItem
                  icon={<MenuAlt2Icon />}
                  onClick={handleChangeBlockType.note}
                >
                  Note
                </MenuItem>
                <MenuItem
                  icon={<CodeIcon />}
                  onClick={handleChangeBlockType.snippet}
                >
                  Snippet
                </MenuItem>
              </MenuList>
            </Menu>
            <IconButton
              colorScheme="red"
              variant="ghost"
              size="xs"
              isRound
              aria-label="Delete"
              onClick={deleteBrick}
            >
              <TrashIcon />
            </IconButton>
          </div>
        }
      />
    </div>
  );
};
