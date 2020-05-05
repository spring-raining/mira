import React, { useState, useCallback, useEffect } from 'react';
import unified from 'unified';
import remarkParse from 'remark-parse';
import remarkReact from 'remark-react';
import { Editor } from './Editor';

export const MarkdownBlock: React.FC<{ note: string }> = ({ note }) => {
  const [code, setCode] = useState(() => note);
  const [rendered, setRendered] = useState(null);
  const onChange = useCallback(setCode, []);
  useEffect(() => {
    const rendered: any = unified()
      .use(remarkParse)
      .use(remarkReact)
      .processSync(code);
    setRendered(rendered.result);
  }, [code]);

  return (
    <>
      <Editor {...{ onChange }} language="markdown" code={code} />
      {rendered || null}
    </>
  );
};
