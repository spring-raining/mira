import React from 'react';
import { Universe } from './components/Universe';
import { UniverseProvider } from './context';

const moduleLoader = (specifier: string) =>
  import(/* @vite-ignore */ specifier);

function App() {
  return (
    <UniverseProvider>
      <Universe
        moduleLoader={moduleLoader}
        config={{
          eval: '/_mira/-/node_modules/@mirajs/react/dist/eval.js',
          runtime: '/_mira/-/node_modules/@mirajs/react/dist/runtime.js',
        }}
        mdx={`# Hello Mira!`}
      />
    </UniverseProvider>
  );
}

export default App;
