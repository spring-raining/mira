#!/usr/bin/env node
'use strict';

import 'reflect-metadata';

(async () => {
  const { main } = await import('../dist/cli.js');
  main();
})();
