import { parse } from 'sucrase/dist/parser';
import { scanExports } from '../src/export-parser';
import { Scanner } from '../src/export-parser/scanner';

it('scanFunctionDeclaration', async () => {
  const source = `
    function func ({[[w[\`\${x[y]}\`]].z]: a,c=a, 'a': b = c, 1.0: b, d, e:f, ...g,}, [,a,,b=[],{c:d, e, ...f}, [g, h=1],...await,], [a]=1, {b}=1, c, ...{d}) {}
  `;
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);
  const declaration = scanner.scanFunctionDeclaration(0);
  expect(declaration).toMatchObject({
    type: 'FunctionDeclaration',
    id: {
      type: 'Identifier',
      name: 'func',
    },
    generator: false,
    async: false,
    params: [
      {
        type: 'ObjectPattern',
        properties: [
          {
            type: 'Property',
            key: {
              type: 'Identifier',
              name: 'c',
            },
            computed: false,
            method: false,
            shorthand: true,
            kind: 'init',
          },
          {
            type: 'Property',
            key: {
              type: 'Literal',
              value: 'a',
              raw: "'a'",
            },
            computed: false,
            method: false,
            shorthand: false,
            kind: 'init',
          },
          {
            type: 'Property',
            key: {
              type: 'Literal',
              value: 1,
              raw: '1.0',
            },
            computed: false,
            method: false,
            shorthand: false,
            kind: 'init',
          },
          {
            type: 'Property',
            key: {
              type: 'Identifier',
              name: 'd',
            },
            computed: false,
            method: false,
            shorthand: true,
            kind: 'init',
          },
          {
            type: 'Property',
            key: {
              type: 'Identifier',
              name: 'e',
            },
            computed: false,
            method: false,
            shorthand: false,
            kind: 'init',
          },
          {
            type: 'RestElement',
            argument: {
              type: 'Identifier',
              name: 'g',
            },
          },
        ],
      },
      {
        type: 'ArrayPattern',
        elements: [
          null,
          {
            type: 'Identifier',
            name: 'a',
          },
          null,
          {
            type: 'AssignmentPattern',
            left: {
              type: 'Identifier',
              name: 'b',
            },
          },
          {
            type: 'ObjectPattern',
            properties: [
              {
                type: 'Property',
                key: {
                  type: 'Identifier',
                  name: 'c',
                },
                computed: false,
                method: false,
                shorthand: false,
                kind: 'init',
              },
              {
                type: 'Property',
                key: {
                  type: 'Identifier',
                  name: 'e',
                },
                computed: false,
                method: false,
                shorthand: true,
                kind: 'init',
              },
              {
                type: 'RestElement',
                argument: {
                  type: 'Identifier',
                  name: 'f',
                },
              },
            ],
          },
          {
            type: 'ArrayPattern',
            elements: [
              {
                type: 'Identifier',
                name: 'g',
              },
              {
                type: 'AssignmentPattern',
                left: {
                  type: 'Identifier',
                  name: 'h',
                },
              },
            ],
          },
          {
            type: 'RestElement',
            argument: {
              type: 'Identifier',
              name: 'await',
            },
          },
          null,
        ],
      },
      {
        type: 'AssignmentPattern',
        left: {
          type: 'ArrayPattern',
          elements: [
            {
              type: 'Identifier',
              name: 'a',
            },
          ],
        },
      },
      {
        type: 'AssignmentPattern',
        left: {
          type: 'ObjectPattern',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'b',
              },
              computed: false,
              method: false,
              shorthand: true,
              kind: 'init',
            },
          ],
        },
      },
      {
        type: 'Identifier',
        name: 'c',
      },
      {
        type: 'RestElement',
        argument: {
          type: 'ObjectPattern',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'd',
              },
              computed: false,
              method: false,
              shorthand: true,
              kind: 'init',
            },
          ],
        },
      },
    ],
  });
});

it('scanClassDeclaration', async () => {
  const source = `
    class Hello extends x.y.z {}
  `;
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);
  const declaration = scanner.scanClassDeclaration(0);
  expect(declaration).toMatchObject({
    type: 'ClassDeclaration',
    id: {
      type: 'Identifier',
      name: 'Hello',
    },
  });
});

it('scanVariableDeclarator', async () => {
  const source = `
    const a, b=1, c=(\`xxx\`), d=function *({xxx}){};
    let e = ()=>{};
    var f = xxx =>1,
    g = async ({a},[b=c,...d],...{})=>()=>()=>0,
    h = class {};
  `;
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);

  const declarationA = scanner.scanVariableDeclarator(1);
  expect(declarationA).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'a',
    },
    init: null,
  });

  const declarationB = scanner.scanVariableDeclarator(3);
  expect(declarationB).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'b',
    },
    init: {
      type: 'UnknownExpression',
    },
  });

  const declarationC = scanner.scanVariableDeclarator(7);
  expect(declarationC).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'c',
    },
    init: {
      type: 'UnknownExpression',
    },
  });

  const declarationD = scanner.scanVariableDeclarator(15);
  expect(declarationD).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'd',
    },
    init: {
      type: 'FunctionExpression',
      id: null,
      generator: true,
      async: false,
      params: [
        {
          type: 'ObjectPattern',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'xxx',
              },
              computed: false,
              method: false,
              shorthand: true,
              kind: 'init',
            },
          ],
        },
      ],
    },
  });

  const declarationE = scanner.scanVariableDeclarator(28);
  expect(declarationE).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'e',
    },
    init: {
      type: 'ArrowFunctionExpression',
      id: null,
      generator: false,
      async: false,
      params: [],
    },
  });

  const declarationF = scanner.scanVariableDeclarator(37);
  expect(declarationF).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'f',
    },
    init: {
      type: 'ArrowFunctionExpression',
      id: null,
      generator: false,
      async: false,
      params: [
        {
          type: 'Identifier',
          name: 'xxx',
        },
      ],
    },
  });

  const declarationG = scanner.scanVariableDeclarator(43);
  expect(declarationG).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'g',
    },
    init: {
      type: 'ArrowFunctionExpression',
      id: null,
      generator: false,
      async: true,
      params: [
        {
          type: 'ObjectPattern',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'a',
              },
            },
          ],
        },
        {
          type: 'ArrayPattern',
          elements: [
            {
              type: 'AssignmentPattern',
              left: {
                type: 'Identifier',
                name: 'b',
              },
            },
            {
              type: 'RestElement',
              argument: {
                type: 'Identifier',
                name: 'd',
              },
            },
          ],
        },
        {
          type: 'RestElement',
          argument: {
            type: 'ObjectPattern',
            properties: [],
          },
        },
      ],
    },
  });

  const declarationH = scanner.scanVariableDeclarator(73);
  expect(declarationH).toMatchObject({
    type: 'VariableDeclarator',
    id: {
      type: 'Identifier',
      name: 'h',
    },
    init: {
      type: 'ClassExpression',
      id: null,
    },
  });
});

it('Scan export declarations', async () => {
  const source = `
    export {a, b as c};
    export class d extends a {}
    export const e = (y) => {
    },f,g
    export async function h(i) {}

    export * from 'x';
    export * as c from 'y';
    export {i as j} from 'z';

    export default function* e(a, b, ...c) {}
    export default class {}
    export default ({test}) => test;
  `;
  const scanner = scanExports(source);
  expect((scanner as any).exportDeclarations).toMatchObject([
    {
      type: 'ExportNamedDeclaration',
      source: null,
      specifiers: [
        {
          type: 'ExportSpecifier',
          local: {
            type: 'Identifier',
            name: 'a',
          },
          exported: {
            type: 'Identifier',
            name: 'a',
          },
        },
        {
          type: 'ExportSpecifier',
          local: {
            type: 'Identifier',
            name: 'b',
          },
          exported: {
            type: 'Identifier',
            name: 'c',
          },
        },
      ],
      declaration: null,
    },
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'ClassDeclaration',
        id: {
          type: 'Identifier',
          name: 'd',
        },
      },
      specifiers: [],
      source: null,
    },
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'e',
            },
            init: {
              type: 'ArrowFunctionExpression',
              generator: false,
              id: null,
              params: [
                {
                  type: 'Identifier',
                  name: 'y',
                },
              ],
              async: false,
            },
          },
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'f',
            },
            init: null,
          },
          {
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: 'g',
            },
            init: null,
          },
        ],
        kind: 'const',
      },
    },
    {
      type: 'ExportNamedDeclaration',
      declaration: {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'h',
        },
        generator: false,
        async: true,
        params: [
          {
            type: 'Identifier',
            name: 'i',
          },
        ],
      },
      specifiers: [],
      source: null,
    },
    {
      type: 'ExportAllDeclaration',
      source: {
        type: 'Literal',
        value: 'x',
        raw: "'x'",
      },
      exported: null,
    },
    {
      type: 'ExportAllDeclaration',
      source: {
        type: 'Literal',
        value: 'y',
        raw: "'y'",
      },
      exported: {
        type: 'Identifier',
        name: 'c',
      },
    },
    {
      type: 'ExportNamedDeclaration',
      source: {
        type: 'Literal',
        value: 'z',
        raw: "'z'",
      },
      specifiers: [
        {
          type: 'ExportSpecifier',
          local: {
            type: 'Identifier',
            name: 'i',
          },
          exported: {
            type: 'Identifier',
            name: 'j',
          },
        },
      ],
      declaration: null,
    },
    {
      type: 'ExportDefaultDeclaration',
      declaration: {
        type: 'FunctionDeclaration',
        id: {
          type: 'Identifier',
          name: 'e',
        },
        generator: true,
        async: false,
        params: [
          {
            type: 'Identifier',
            name: 'a',
          },
          {
            type: 'Identifier',
            name: 'b',
          },
          {
            type: 'RestElement',
            argument: {
              type: 'Identifier',
              name: 'c',
            },
          },
        ],
      },
    },
    {
      type: 'ExportDefaultDeclaration',
      declaration: {
        type: 'ClassDeclaration',
        id: null,
      },
    },
    {
      type: 'ExportDefaultDeclaration',
      declaration: {
        type: 'ArrowFunctionExpression',
        generator: false,
        id: null,
        params: [
          {
            type: 'ObjectPattern',
            properties: [
              {
                type: 'Property',
                key: {
                  type: 'Identifier',
                  name: 'test',
                },
                computed: false,
                method: false,
                shorthand: true,
                kind: 'init',
              },
            ],
          },
        ],
        async: false,
      },
    },
  ]);
});

it('Scan import declarations', async () => {
  const source = `
    import a, { b, c as d } from 'foo';
    import e, * as f from 'bar';
    import 'baz';
  `;
  const scanner = scanExports(source);
  expect((scanner as any).importDeclarations).toMatchObject([
    {
      type: 'ImportDeclaration',
      source: {
        type: 'Literal',
        value: 'foo',
        raw: "'foo'",
      },
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          local: {
            type: 'Identifier',
            name: 'a',
          },
        },
        {
          type: 'ImportSpecifier',
          local: {
            type: 'Identifier',
            name: 'b',
          },
          imported: {
            type: 'Identifier',
            name: 'b',
          },
        },
        {
          type: 'ImportSpecifier',
          local: {
            type: 'Identifier',
            name: 'c',
          },
          imported: {
            type: 'Identifier',
            name: 'd',
          },
        },
      ],
    },
    {
      type: 'ImportDeclaration',
      source: {
        type: 'Literal',
        value: 'bar',
        raw: "'bar'",
      },
      specifiers: [
        {
          type: 'ImportDefaultSpecifier',
          local: {
            type: 'Identifier',
            name: 'e',
          },
        },
        {
          type: 'ImportNamespaceSpecifier',
          local: {
            type: 'Identifier',
            name: 'f',
          },
        },
      ],
    },
    {
      type: 'ImportDeclaration',
      source: {
        type: 'Literal',
        value: 'baz',
        raw: "'baz'",
      },
      specifiers: [],
    },
  ]);
});
