import { resolveFileAndOptions } from '@mdx-js/mdx/lib/util/resolve-file-and-options';
import toH from 'hast-to-hyperscript';
import { MDXComponents } from 'mdx/types';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { createCompileToHastProcessor } from '../mdx/processsor';

// Avoid installing `@mdx-js/react` package, otherwise it breaks type definition of React
const defaultComponents: MDXComponents = {
  a: (props: React.HTMLAttributes<HTMLElement>) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {props.children}
    </a>
  ),
};
const MDXContext = createContext({});
const useMDXComponents = (components: MDXComponents) => {
  const contextComponents = useContext(MDXContext);
  return useMemo(
    () => ({ ...contextComponents, ...components }),
    [contextComponents, components],
  );
};

export const MarkdownProvider: React.FC = ({ children }) => {
  const allComponents = useMDXComponents(defaultComponents);
  return (
    <MDXContext.Provider value={allComponents}>{children}</MDXContext.Provider>
  );
};

const compileToHast = async (mdx: string) => {
  const { file } = resolveFileAndOptions(mdx);
  const markdownCompiler = createCompileToHastProcessor();
  const parsed = markdownCompiler.parse(file);
  const transformed = await markdownCompiler.run(parsed);
  return transformed;
};

export const useMarkdownRenderer = (mdx: string) => {
  const [element, setElement] = useState<React.ReactElement>();

  useEffect(() => {
    (async () => {
      const transformed = await compileToHast(mdx);
      const root = toH(React.createElement, transformed);
      setElement(root);
    })();
  }, [mdx]);

  return { element };
};
