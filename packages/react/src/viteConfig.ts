import type { Framework } from '@mirajs/core';

export const viteConfig: Framework['viteConfig'] = {
  optimizeDeps: {
    include: ['@mirajs/react', 'react', 'react-dom'],
  },
};

export default viteConfig;
