import clsx from 'clsx';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { sprinkles } from '../../styles/sprinkles.css';
import { noop } from '../../util';
import { Input, InputGroup, InputElement } from '../atomic/input';
import * as style from './LanguageCompletionForm.css';

export const LanguageCompletionForm: React.VFC<
  {
    language: string;
    onChange?: (lang: string) => void;
    onSubmit?: (lang: string) => void;
    isActive: boolean;
    rightElement: React.ReactElement;
  } & Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange' | 'onSubmit'>
> = ({
  language,
  onChange = noop,
  onSubmit = noop,
  onFocus: handleFocus = noop,
  onBlur: handleBlur = noop,
  isActive,
  rightElement,
  ...other
}) => {
  const [text, setText] = useState(language);
  const inputEl = useRef<HTMLInputElement>(null);
  const handleChangeText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
      onChange(e.target.value);
    },
    [onChange],
  );
  const [editorActive, setEditorActive] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorActive(true);
  }, []);
  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setEditorActive(true);
      handleFocus(e);
    },
    [handleFocus],
  );
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const lang = text.trim().split(/\s/)[0] ?? '';
      setText(lang);
      onChange(lang);
      onSubmit(lang);
      setEditorActive(false);
      handleBlur(e);
    },
    [onChange, onSubmit, text, handleBlur],
  );
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputEl.current?.blur();
    }
  }, []);

  useEffect(() => {
    setText(language);
  }, [language]);

  useEffect(() => {
    if (!editorActive) {
      return;
    }
    const cb = () => {
      inputEl.current?.blur();
    };
    window.addEventListener('click', cb);
    return () => window.removeEventListener('click', cb);
  }, [editorActive]);

  return (
    <InputGroup
      className={style.formContainer({ isActive })}
      onClick={handleClick}
    >
      <Input
        {...other}
        className={clsx(
          style.formInput,
          !editorActive && sprinkles({ opacity: 0 }),
        )}
        ref={inputEl}
        type="text"
        tabIndex={0}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
        value={text}
        onChange={handleChangeText}
        {...{ onFocus, onBlur, onKeyDown }}
      />
      <code
        className={clsx(
          style.formDisplayingCode,
          editorActive && sprinkles({ visibility: 'hidden' }),
        )}
      >
        {text}
      </code>
      <InputElement
        placement="right"
        className={clsx(!isActive && sprinkles({ visibility: 'hidden' }))}
      >
        {rightElement}
      </InputElement>
    </InputGroup>
  );
};
