import React from 'react';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import lightTheme from 'prism-react-renderer/themes/nightOwlLight';

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
          {tokens.map((line, key) => (
            <div {...getLineProps({ line, key })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  );
};
