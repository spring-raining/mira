import mdx from '@mdx-js/mdx';
import { mdxOptions } from '@asteroid-pkg/mdx';

it('parse', async () => {
  const str = await mdx(
    `
---
asteroid:
  framework: react
  module:
    - 'import paper from "https://unpkg.com/@asteroid-pkg/paper@0.12.4?module"'
---

# Hi

\`abc\`

\`\`\`jsx asteroid=1998SF36
$run(() => <></>)
return 1
\`\`\`

<div><Asteroid_1998SF36 /></div>

    `,
    mdxOptions
  );
  expect(str).toBe('');
});
