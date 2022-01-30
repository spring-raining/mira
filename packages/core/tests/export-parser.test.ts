import { parse } from 'sucrase/dist/parser';
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
