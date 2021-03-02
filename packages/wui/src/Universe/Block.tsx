import { css } from 'lightwindcss';
import React, { useCallback, useState } from 'react';
import { Brick } from '../atoms';
import { useBrick } from '../hooks/brick';
import { Editor } from '../Editor';
import { LanguageCompletionForm } from './LanguageCompletionForm';

export const Block: React.VFC<Pick<Brick, 'brickId'>> = ({ brickId }) => {
  const { brick, isActive } = useBrick(brickId);
  const [languageEditorActive, setLanguageEditorActive] = useState(false);
  const [language, setLanguage] = useState('');
  const languageCompletionHandlers = {
    onMount: useCallback(() => setLanguageEditorActive(true), []),
    onSubmit: useCallback((lang: string) => {
      setLanguage(lang);
      setLanguageEditorActive(false);
    }, []),
    onBlur: useCallback(() => setLanguageEditorActive(false), []),
  };

  return (
    <div>
      <div
        className={css`
          display: flex;
          justify-content: start;
          align-items: flex-start;
          width: 100%;
        `}
      >
        <div
          className={css`
            width: 50%;
            margin: 1rem;
            padding-right: 1rem;
            border-radius: 4px;
          `}
          style={{
            backgroundColor: isActive ? '#f4f4f5' : '#fafafa',
          }}
        >
          <div className={css`position: relative`}>
            <div
              style={{ visibility: languageEditorActive ? 'initial' : 'hidden' }}
            >
              <LanguageCompletionForm {...languageCompletionHandlers} />
            </div>
            <div
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
              `}
              style={{ visibility: languageEditorActive ? 'hidden' : 'initial' }}
              onClick={() => setLanguageEditorActive(true)}
            >
              {language}
            </div>
          </div>
          {language && (
            <Editor code={brick.text} language={language.toLowerCase()} />
          )}
        </div>
      </div>
    </div>
  );
};
