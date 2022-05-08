import fs from 'fs';
import path from 'path';
import { compile } from '../src/index';

it('parse', async () => {
  const str = await compile(
    fs.readFileSync(path.join(__dirname, 'test.mdx'), { encoding: 'utf8' }),
  );
  expect(str).toBe('');
});
