import { parse } from 'sucrase/dist/parser';
import { scanExports } from '../src/declaration-parser';
import { Scanner } from '../src/declaration-parser/scanner';

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

it('scanDeclaration', async () => {
  const source = `
    const a, b=1, c=(\`xxx\`), d=function *({xxx}){};
    let e = ()=>{}
    var f = xxx =>1,
    g = async ({a},[b=c,...d],...{})=>()=>()=>0,
    h = class {}
    const {i,j:k,...l}= {i,j:\`}\${({[a]:1})}{\`}, [m,,...n]= [1,2,3]
  `;
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);

  const declarationA = scanner.scanDeclaration(0);
  expect(declarationA).toMatchObject({
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'a',
        },
        init: null,
      },
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'b',
        },
        init: {
          type: 'UnknownExpression',
        },
      },
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'c',
        },
        init: {
          type: 'UnknownExpression',
        },
      },
      {
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
      },
    ],
  });

  const declarationB = scanner.scanDeclaration(27);
  expect(declarationB).toMatchObject({
    type: 'VariableDeclaration',
    kind: 'let',
    declarations: [
      {
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
      },
    ],
  });

  const declarationC = scanner.scanDeclaration(35);
  expect(declarationC).toMatchObject({
    type: 'VariableDeclaration',
    kind: 'var',
    declarations: [
      {
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
      },
      {
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
      },
      {
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'h',
        },
        init: {
          type: 'ClassExpression',
          id: null,
        },
      },
    ],
  });

  const declarationD = scanner.scanDeclaration(77);
  expect(declarationD).toMatchObject({
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        id: {
          type: 'ObjectPattern',
          properties: [
            {
              type: 'Property',
              key: {
                type: 'Identifier',
                name: 'i',
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
                name: 'j',
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
                name: 'l',
              },
            },
          ],
        },
        init: {
          type: 'UnknownExpression',
        },
      },
      {
        type: 'VariableDeclarator',
        id: {
          type: 'ArrayPattern',
          elements: [
            {
              type: 'Identifier',
              name: 'm',
            },
            null,
            {
              type: 'RestElement',
              argument: {
                type: 'Identifier',
                name: 'n',
              },
            },
          ],
        },
        init: {
          type: 'UnknownExpression',
        },
      },
    ],
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
  expect(scanner.exportDeclarations).toMatchObject([
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
  expect(scanner.importDeclarations).toMatchObject([
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
