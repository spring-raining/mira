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
          base: '/',
          depsContext: '/_mira/',
          framework: '/node_module/@mirajs/react',
        }}
        mdx={`# Hello Mira!`}
      />
    </UniverseProvider>
  );
}

export default App;
