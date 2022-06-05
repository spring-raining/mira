import { describe, it, expect, vi } from 'vitest';
import { DependencyManager } from '../src/dependency-manager';
import { TestTranspiler } from './dependency-manager/transpiler';

describe('Dependency manager tests', () => {
  const transpiler = new TestTranspiler();

  it('Consumes single export', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertSnippet('A', `export const a = 'foo';`);
    expect(dep._snippetData.A).toMatchObject({
      transformedCode: `export const a = "foo";\n`,
      importDefs: [],
      exportValues: new Set(['a']),
      dependentValues: new Set(),
      hasDefaultExport: false,
      defaultFunctionParams: null,
    });
    expect(dep._valDependency).toMatchObject({ a: new Set() });
    expect(dep._definedValues).toMatchObject(new Set('a'));
  });

  it('Works serial tasks well', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await Promise.all([
      dep.upsertSnippet('A', `export const a = 1;`),
      dep.upsertSnippet('B', `export const a = 2;`),
      dep.upsertSnippet('A', `export const b = 3;`),
    ]);
    expect(dep._snippetData).toMatchObject({
      A: { exportValues: new Set(['b']) },
      B: { exportValues: new Set(['a']) },
    });
    expect(dep._definedValues).toMatchObject(new Set(['a', 'b']));
  });

  it('Hoist dependency import', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertSnippet('C', `export const c = b()`);
    await dep.upsertSnippet('B', `export const b = a()`);
    expect(dep._snippetData.C).toMatchObject({
      transformedCode: `import { b } from "#B";\nexport const c = b();\n`,
      exportValues: new Set(['c']),
      dependentValues: new Set(['b']),
    });
    expect(dep._snippetData.B).toMatchObject({
      transformedCode: `export const b = a();\n`,
      exportValues: new Set(['b']),
      dependentValues: new Set(),
    });

    await dep.upsertSnippet('A', `export const a = () => 1`);
    expect(dep._snippetData.C).toMatchObject({
      dependentValues: new Set(['a', 'b']),
    });
    expect(dep._snippetData.B).toMatchObject({
      transformedCode: `import { a } from "#A";\nexport const b = a();\n`,
      exportValues: new Set(['b']),
      dependentValues: new Set(['a']),
    });
    expect(dep._valDependency).toMatchObject({
      a: new Set(),
      b: new Set(['a']),
      c: new Set(['a', 'b']),
    });
  });

  it('Fails on define duplication', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertSnippet('A', `export const a = 1;`);
    await expect(async () => {
      await dep.upsertSnippet('B', `export const a = 2;`);
    }).rejects.toThrow('Value a has already defined');
  });

  it('Fails on circular reference', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertSnippet('A', `export const a = b();`);
    await dep.upsertSnippet('B', `export const b = c();`);
    await expect(async () => {
      await dep.upsertSnippet('C', `export const c = a();`);
    }).rejects.toThrow(
      'Cyclic reference was found. Please check the exporting value',
    );
  });

  it('Clear dependency after delete snippet', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertSnippet('A', `export const a = 1;`);
    await dep.upsertSnippet('B', `export const b = a;`);
    await dep.upsertSnippet('C', `export const c = b;`);
    expect(dep._snippetData.B).toMatchObject({
      transformedCode: `import { a } from "#A";\nexport const b = a;\n`,
      dependentValues: new Set(['a']),
    });
    expect(dep._snippetData.C).toMatchObject({
      transformedCode: `import { b } from "#B";\nexport const c = b;\n`,
      dependentValues: new Set(['a', 'b']),
    });
    expect(dep._definedValues).toMatchObject(new Set(['a', 'b', 'c']));
    expect(dep._valDependency).toMatchObject({
      a: new Set(),
      b: new Set(['a']),
      c: new Set(['a', 'b']),
    });

    await dep.deleteSnippet('A');
    expect(dep._snippetData.B).toMatchObject({
      transformedCode: `export const b = a;\n`,
      dependentValues: new Set(),
    });
    expect(dep._snippetData.C).toMatchObject({
      transformedCode: `import { b } from "#B";\nexport const c = b;\n`,
      dependentValues: new Set(['b']),
    });
    expect(dep._definedValues).toMatchObject(new Set(['b', 'c']));
    expect(dep._valDependency).toMatchObject({
      b: new Set(),
      c: new Set(['b']),
    });
  });

  it('Dispatch dependency update event', async () => {
    const onDependencyUpdate = vi.fn();
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
      onDependencyUpdate,
    });
    await dep.upsertSnippet('A', `export const a = b + c;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(1);

    await dep.upsertSnippet('B', `export const b = c;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(3);
    expect(onDependencyUpdate.mock.calls.slice(1, 3)).toEqual(
      expect.arrayContaining([['A'], ['B']]),
    );

    await dep.upsertSnippet('C', `export const c = 1;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(6);
    expect(onDependencyUpdate.mock.calls.slice(3, 6)).toEqual(
      expect.arrayContaining([['A'], ['B'], ['C']]),
    );

    await dep.deleteSnippet('B');
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(8);
    expect(onDependencyUpdate.mock.calls.slice(6, 8)).toEqual(
      expect.arrayContaining([['A'], ['B']]),
    );
  });

  it('Handle snippet exports update', async () => {
    const onDependencyUpdate = vi.fn();
    const onSourceRevoke = vi.fn();
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
      onDependencyUpdate,
      onSourceRevoke,
    });
    await dep.upsertSnippet('A', `export const a = 1;`);
    await dep.upsertSnippet('B', `export const b = a;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(2);
    await dep.updateSnippetExports('A', 'foo', new Map([['a', 1]]));
    await dep.taskPromise;
    expect(dep._snippetSource).toMatchObject({ A: 'foo' });
    expect(dep._exportVal).toMatchObject(new Map([['a', 1]]));
    expect(onDependencyUpdate).toBeCalledTimes(3);
    expect(onDependencyUpdate).lastCalledWith('B');

    await dep.updateSnippetExports('A', 'bar', new Map([['a', 2]]));
    await dep.taskPromise;
    expect(dep._snippetSource).toMatchObject({ A: 'bar' });
    expect(dep._exportVal).toMatchObject(new Map([['a', 2]]));
    expect(onDependencyUpdate).toBeCalledTimes(4);
    expect(onDependencyUpdate).lastCalledWith('B');
    expect(onSourceRevoke).lastCalledWith('foo');

    await dep.upsertSnippet('A', `export const c = 1;`);
    await dep.taskPromise;
    expect(dep._exportVal).toMatchObject(new Map());
    expect(onDependencyUpdate).toBeCalledTimes(6);

    await dep.updateSnippetExports('A', 'baz', new Map([['c', 1]]));
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(6);
    expect(dep._exportVal).toMatchObject(new Map([['c', 1]]));
    expect(onSourceRevoke).lastCalledWith('bar');

    await dep.deleteSnippet('A');
    await dep.taskPromise;
    expect(dep._snippetSource).toMatchObject({});
    expect(dep._exportVal).toMatchObject(new Map());
    expect(onSourceRevoke).lastCalledWith('baz');
  });
});
