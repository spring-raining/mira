import { describe, it, expect } from 'vitest';
import { scanExportDeclaration } from '../src/ecma-import';

describe('ES modules tests', () => {
  it('scan various module exports', async () => {
    const source1 = `
      export {a, b as c};
      export class d extends a {}
      export const e = (y) => {
      },f,g
      export async function h(i) {}
    `;
    const exports1 = await scanExportDeclaration(source1);
    expect(exports1).toEqual(new Set(['a', 'c', 'd', 'e', 'f', 'g', 'h']));

    const source2 = `
      export let [{[[w[\`\${x[y]}\`]].z]: a,c=a, '.a': b = c, 1.0: b, d, e:f, ...g,}, [,h,,i=[],{j:k, l, ...m}, [n, o=1],...await,], [p]=1, {q}=1, r, ...{s}] = [];
    `;
    const exports2 = await scanExportDeclaration(source2);
    // prettier-ignore
    expect(exports2).toEqual(new Set(['c', '.a', 'd', 'e', 'g', 'h', 'i', 'j', 'l', 'm', 'n', 'o', 'await', 'p', 'q', 'r', 's']));

    const source3 = `
      export {i as j} from 'x';
      export * from 'y';
      export * as k from 'z';
    `;
    const exports3 = await scanExportDeclaration(source3);
    expect(exports3).toEqual(new Set(['j', 'k']));

    const source4 = `export default function* e(a, b, ...c) {}`;
    expect(await scanExportDeclaration(source4)).toEqual(new Set(['default']));

    const source5 = `export default class {}`;
    expect(await scanExportDeclaration(source5)).toEqual(new Set(['default']));

    const source6 = `export default ({test}) => test`;
    expect(await scanExportDeclaration(source6)).toEqual(new Set(['default']));
  });
});
