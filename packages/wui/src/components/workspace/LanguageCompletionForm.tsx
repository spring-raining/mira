import React, { useState, useCallback, useEffect, useRef } from 'react';
import { noop } from '../../util';

// const FormContainer = styled.div`
//   display: flex;
//   align-items: center;
//   position: relative;
//   width: 100%;
//   height: 100%;
// `;
// const FormInput = styled.input<{ active?: boolean }>`
//   flex: 1;
//   appearance: none;
//   background: inherit;
//   outline: none;
//   border: 2px solid transparent;
//   padding-inline-start: 1rem;
//   padding-inline-end: 1rem;
//   position: absolute;
//   width: 100%;
//   height: 100%;
//   font-family: ${cssVar('fonts.mono')};
//   font-size: 0.8em;
//   opacity: ${(props) => (props.active ? 1 : 0)};
//   &:focus {
//     border-color: ${cssVar('colors.blue.500')};
//   }
// `;
// const FormDisplayingCode = styled.code<{ active?: boolean }>`
//   flex: 1;
//   padding-inline-start: calc(1rem + 2px);
//   padding-inline-end: calc(1rem + 2px);
//   font-family: ${cssVar('fonts.mono')};
//   font-size: 0.8rem;
//   overflow: hidden;
//   text-overflow: ellipsis;
//   white-space: nowrap;
//   visibility: ${(props) => (props.active ? 'initial' : 'hidden')};
// `;

export const LanguageCompletionForm: React.VFC<
  {
    language: string;
    onChange?: (lang: string) => void;
    onSubmit?: (lang: string) => void;
  } & Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange' | 'onSubmit'>
> = ({
  language,
  onChange = noop,
  onSubmit = noop,
  onFocus: handleFocus = noop,
  onBlur: handleBlur = noop,
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
    <div onClick={handleClick}>
      <input
        {...other}
        ref={inputEl}
        type="text"
        tabIndex={0}
        autoCapitalize="none"
        autoComplete="off"
        spellCheck="false"
        value={text}
        onChange={handleChangeText}
        // active={editorActive}
        {...{ onFocus, onBlur, onKeyDown }}
      />
      <code
      // active={!editorActive}
      >
        {text}
      </code>
    </div>
  );
};
