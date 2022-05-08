import type { Framework } from '@mirajs/util';

export const viteConfig: Framework['viteConfig'] = {
  optimizeDeps: {
    include: ['@mirajs/framework-react', 'react', 'react-dom'],
  },
};

export default viteConfig;
