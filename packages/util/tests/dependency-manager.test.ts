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
      expect.arrayContaining([
        [expect.objectContaining({ id: 'A' })],
        [expect.objectContaining({ id: 'B' })],
      ]),
    );

    await dep.upsertSnippet('C', `export const c = 1;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(6);
    expect(onDependencyUpdate.mock.calls.slice(3, 6)).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ id: 'A' })],
        [expect.objectContaining({ id: 'B' })],
        [expect.objectContaining({ id: 'C' })],
      ]),
    );

    await dep.deleteSnippet('B');
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(8);
    expect(onDependencyUpdate.mock.calls.slice(6, 8)).toEqual(
      expect.arrayContaining([
        [expect.objectContaining({ id: 'A' })],
        [expect.objectContaining({ id: 'B' })],
      ]),
    );
  });

  it('Handle snippet exports update', async () => {
    let numToCallSourceBuilder = 0;
    const snippetSourceBuilder = vi.fn().mockImplementation((id) => {
      numToCallSourceBuilder++;
      return `#${id}:${numToCallSourceBuilder}`;
    });
    const onDependencyUpdate = vi.fn();
    const onSourceRevoke = vi.fn();
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
      snippetSourceBuilder,
      onDependencyUpdate,
      onSourceRevoke,
    });
    await dep.upsertSnippet('A', `export const a = 1;`);
    await dep.upsertSnippet('B', `export const b = a;`);
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(2);
    await dep.updateSnippetExports('A', new Map([['a', 1]]));
    await dep.taskPromise;
    expect(dep._snippetSource).toEqual({ A: '#A:1', B: '#B:2' });
    expect(dep._exportVal).toEqual(new Map([['a', 1]]));
    expect(onDependencyUpdate).toBeCalledTimes(3);
    expect(onDependencyUpdate).lastCalledWith(
      expect.objectContaining({ id: 'B' }),
    );
    expect(snippetSourceBuilder).lastCalledWith(
      'B',
      `import { a } from "#A:1";\nexport const b = a;\n`,
    );

    await dep.updateSnippetExports('A', new Map([['a', 2]]));
    await dep.taskPromise;
    expect(dep._exportVal).toEqual(new Map([['a', 2]]));
    expect(onDependencyUpdate).toBeCalledTimes(4);
    expect(onDependencyUpdate).lastCalledWith(
      expect.objectContaining({ id: 'B' }),
    );

    await dep.upsertSnippet('A', `export const c = 1;`);
    await dep.taskPromise;
    expect(dep._snippetSource).toEqual({ A: '#A:3', B: '#B:4' });
    expect(dep._exportVal).toEqual(new Map());
    expect(onDependencyUpdate).toBeCalledTimes(6);
    expect(onSourceRevoke).lastCalledWith({ id: 'B', source: '#B:2' });
    expect(snippetSourceBuilder).lastCalledWith('B', `export const b = a;\n`);

    await dep.updateSnippetExports('A', new Map([['c', 1]]));
    await dep.taskPromise;
    expect(onDependencyUpdate).toBeCalledTimes(6);
    expect(dep._exportVal).toEqual(new Map([['c', 1]]));

    await dep.deleteSnippet('A');
    await dep.taskPromise;
    expect(dep._snippetSource).toEqual({ B: '#B:4' });
    expect(dep._exportVal).toEqual(new Map());
    expect(onSourceRevoke).lastCalledWith({ id: 'A', source: '#A:3' });
  });

  it('Supports module import', async () => {
    const dep = new DependencyManager({
      transpiler,
      throwsOnTaskFail: true,
    });
    await dep.upsertModule(
      'M1',
      `import a, {b, c as C} from './A'\nimport * as D from './B'\nimport './C'`,
    );
    const expectedImportDefs = [
      {
        specifier: './A',
        all: false,
        default: true,
        namespace: false,
        named: ['b', 'c'],
        importBinding: { b: 'b', c: 'C', default: 'a' },
        namespaceImport: null,
      },
      {
        specifier: './B',
        all: false,
        default: false,
        namespace: true,
        named: [],
        importBinding: {},
        namespaceImport: 'D',
      },
      {
        specifier: './C',
        all: true,
        default: false,
        namespace: false,
        named: [],
        importBinding: {},
        namespaceImport: null,
      },
    ];
    expect(dep._moduleImportData.M1).toEqual({
      importDefs: expectedImportDefs,
      exportValues: new Set(['a', 'b', 'C', 'D']),
    });

    await dep.upsertSnippet('A', `export const x = [a, b, C, D]`);
    expect(dep._snippetData.A).toMatchObject({
      transformedCode: `import a, { b, c as C } from "./A";\nimport * as D from "./B";\nimport "./C";\nexport const x = [a, b, C, D];\n`,
      importDefs: expectedImportDefs,
      exportValues: new Set(['x']),
      dependentValues: new Set(),
      dependentModuleSpecifiers: new Set(['./A', './B', './C']),
    });

    await dep.upsertSnippet('B', `export const y = 1`);
    expect(dep._snippetData.B).toMatchObject({
      transformedCode: 'import "./C";\nexport const y = 1;\n',
      importDefs: [expectedImportDefs[2]],
      exportValues: new Set(['y']),
      dependentValues: new Set(),
      dependentModuleSpecifiers: new Set(['./C']),
    });

    await dep.upsertSnippet('C', `export const z = x`);
    expect(dep._snippetData.C).toMatchObject({
      transformedCode: `import "./C";\nimport { x } from "#A";\nexport const z = x;\n`,
      importDefs: [
        expectedImportDefs[2],
        {
          specifier: '#A',
          named: ['x'],
          importBinding: { x: 'x' },
        },
      ],
      exportValues: new Set(['z']),
      dependentValues: new Set(['x']),
      dependentModuleSpecifiers: new Set(['./C', '#A']),
    });
  });

  it('Fails on define value already imported', async () => {
    const dep = new DependencyManager({ transpiler });
    await dep.upsertModule('M1', `import a from './A'`);
    await dep.upsertSnippet('A', `export const a = 1;`);
    expect(dep._snippetTransformResult.A).toMatchObject({
      errorObject: new Error('Value a has already defined'),
    });

    await dep.deleteModule('M1');
    expect(dep._snippetData.A).toMatchObject({
      transformedCode: 'export const a = 1;\n',
      exportValues: new Set(['a']),
    });
  });
});
