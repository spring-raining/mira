import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import lightTheme from 'prism-react-renderer/themes/nightOwlLight';
import React from 'react';

export const CodePreview: React.VFC<{ code: string; language: Language }> = ({
  code,
  language,
}) => {
  return (
    <Highlight
      {...defaultProps}
      code={code}
      language={language}
      theme={lightTheme}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, _key) => {
            const { key, ...other } = getLineProps({ line, key: _key });
            return (
              <div key={key} {...other}>
                {line.map((token, _key) => {
                  const { key, ...other } = getTokenProps({ token, key: _key });
                  return <span key={key} {...other} />;
                })}
              </div>
            );
          })}
        </>
      )}
    </Highlight>
  );
};
