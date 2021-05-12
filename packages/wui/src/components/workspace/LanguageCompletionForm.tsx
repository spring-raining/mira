import { css } from 'lightwindcss';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { editorFontFamily } from '../Editor';

export const LanguageCompletionForm: React.VFC<
  {
    language: string;
    onUpdate?: (lang: string) => void;
  } & React.HTMLAttributes<HTMLInputElement>
> = ({
  language,
  onUpdate = () => {},
  onFocus: handleFocus = () => {},
  onBlur: handleBlur = () => {},
  ...other
}) => {
  const [text, setText] = useState(language);
  const inputEl = useRef<HTMLInputElement>(null);
  const handleChangeText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
    },
    []
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
    [handleFocus]
  );
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const lang = text.trim().split(/\s/)[0] ?? '';
      setText(lang);
      onUpdate(lang);
      setEditorActive(false);
      handleBlur(e);
    },
    [onUpdate, text, handleBlur]
  );
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputEl.current?.blur();
    }
  }, []);

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
    <div
      className={css`
        display: flex;
        align-items: center;
        position: relative;
        width: 100%;
        height: 2rem;
      `}
      onClick={handleClick}
    >
      <input
        {...other}
        ref={inputEl}
        type="text"
        tabIndex={0}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
        className={css`
          flex: 1;
          appearance: none;
          background: inherit;
          outline: none;
          border: 2px solid transparent;
          padding-inline-start: 1rem;
          padding-inline-end: 1rem;
          width: 100%;
          height: 100%;
          font-size: 0.8em;
          &:focus {
            border-color: #2b6cb0;
          }
        `}
        style={{
          fontFamily: editorFontFamily,
          opacity: editorActive ? 1 : 0,
          position: 'absolute',
        }}
        value={text}
        onChange={handleChangeText}
        {...{ onFocus, onBlur, onKeyDown }}
      ></input>
      <code
        className={css`
          flex: 1;
          padding-inline-start: calc(1rem + 2px);
          padding-inline-end: calc(1rem + 2px);
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        `}
        style={{
          fontFamily: editorFontFamily,
          visibility: editorActive ? 'hidden' : 'initial',
        }}
      >
        {language}
      </code>
    </div>
  );
};
