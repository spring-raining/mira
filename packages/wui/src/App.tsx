import React from 'react';
import { Universe } from './components/Universe';

function App() {
  return (
    <div>
      <Universe config={{ runtime: '@mirajs/react' }} />
    </div>
  );
}

export default App;
