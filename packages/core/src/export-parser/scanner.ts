import TokenProcessor from 'sucrase/dist/TokenProcessor';
import { IdentifierRole, Token } from 'sucrase/dist/parser/tokenizer';
import { TokenType as tt } from 'sucrase/dist/parser/tokenizer/types';
import {
  Identifier,
  DeclarationBinding,
  ClassDeclaration,
  FunctionDeclaration,
  VariableDeclarator,
  Parameter,
  BindingName,
  ObjectPattern,
  Property,
  RestElement,
  ArrayPattern,
  DestructuringPattern,
  Expression,
  ExportAllDeclaration,
  ExportDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ExportSpecifier,
  StringLiteral,
  VariableDeclaration,
  ImportClause,
  ImportDeclaration,
  ImportSpecifier,
} from './types';

const getIdentifier = (name: string | null): Identifier | null =>
  name !== null
    ? {
        type: 'Identifier',
        name,
      }
    : null;

export class Scanner {
  private tokens: TokenProcessor;
  private binding = new Map<string, DeclarationBinding>();
  private exportDeclarations: Array<
    ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration
  > = [];
  private importDeclarations: ImportDeclaration[] = [];

  constructor(source: string, tokens: Token[]) {
    this.tokens = new TokenProcessor(
      source,
      tokens,
      false,
      false,
      null as any, // not used
    );
  }

  scan() {
    this.tokens.reset();
    this.processRoot();
  }

  processRoot(): void {
    while (!this.tokens.isAtEnd()) {
      const token = this.tokens.currentToken();
      if (token.type === tt._export && token.scopeDepth === 0) {
        this.processExportDeclaration();
      }
      if (token.type === tt._import && token.scopeDepth === 0) {
        this.processImportDeclaration();
      }
      if (token.identifierRole === IdentifierRole.TopLevelDeclaration) {
        this.processTopLevelDeclaration();
      }
      this.tokens.nextToken();
    }
  }

  processExportDeclaration() {
    let index = this.tokens.currentIndex();

    if (this.tokens.matches2AtIndex(index, tt._export, tt._default)) {
      index += 2;
      const rawCode1 = this.tokens.identifierNameAtIndex(index);
      const rawCode2 = this.tokens.identifierNameAtIndex(index + 1);
      let declaration: ExportDeclaration | Expression;
      if (
        rawCode1 === 'function' ||
        (rawCode1 === 'async' && rawCode2 === 'function')
      ) {
        declaration = this.scanFunctionDeclaration(index);
      } else if (rawCode1 === 'class') {
        declaration = this.scanClassDeclaration(index);
      } else {
        declaration = this.scanAssignmentExpression(index);
      }
      this.exportDeclarations.push({
        type: 'ExportDefaultDeclaration',
        declaration,
      });
    } else if (this.tokens.matches2AtIndex(index, tt._export, tt.braceL)) {
      index += 1;
      const ret = this.parseNamedExports(index);
      if (!ret) {
        return;
      }
      const [specifiers] = ret;
      [, index] = ret;
      let source: StringLiteral | null = null;
      if (
        this.tokens.matches2AtIndex(index, tt.name, tt.string) &&
        this.tokens.identifierNameAtIndex(index) === 'from'
      ) {
        source = {
          type: 'Literal',
          raw: this.tokens.identifierNameAtIndex(index + 1),
          value: this.tokens.stringValueAtIndex(index + 1),
        };
      }
      this.exportDeclarations.push({
        type: 'ExportNamedDeclaration',
        specifiers,
        declaration: null,
        source,
      });
    } else if (this.tokens.matches2AtIndex(index, tt._export, tt.star)) {
      index += 2;
      let exported: Identifier | null = null;
      if (this.tokens.matches2AtIndex(index, tt._as, tt.name)) {
        exported = {
          type: 'Identifier',
          name: this.tokens.identifierNameAtIndex(index + 1),
        };
        index += 2;
      }
      if (
        this.tokens.matches2AtIndex(index, tt.name, tt.string) &&
        this.tokens.identifierNameAtIndex(index) === 'from'
      ) {
        const source = {
          type: 'Literal',
          raw: this.tokens.identifierNameAtIndex(index + 1),
          value: this.tokens.stringValueAtIndex(index + 1),
        } as const;
        this.exportDeclarations.push({
          type: 'ExportAllDeclaration',
          source,
          exported,
        });
      }
    } else {
      index += 1;
      const declaration = this.parseDeclaration(index);
      if (declaration) {
        this.exportDeclarations.push({
          type: 'ExportNamedDeclaration',
          specifiers: [],
          declaration,
          source: null,
        });
      }
    }
  }

  processImportDeclaration() {
    const specifiers: ImportClause[] = [];
    let index = this.tokens.currentIndex();
    if (this.tokens.matches2AtIndex(index, tt._import, tt.string)) {
      this.importDeclarations.push({
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          raw: this.tokens.identifierNameAtIndex(index + 1),
          value: this.tokens.stringValueAtIndex(index + 1),
        },
        specifiers: [],
      });
      return;
    } else if (
      this.tokens.matches3AtIndex(index, tt._import, tt.name, tt.comma)
    ) {
      specifiers.push({
        type: 'ImportDefaultSpecifier',
        local: {
          type: 'Identifier',
          name: this.tokens.identifierNameAtIndex(index + 1),
        },
      });
      index += 2;
    }
    index += 1;
    if (
      this.tokens.matches3AtIndex(index, tt.star, tt._as, tt.name) ||
      (this.tokens.matches3AtIndex(index, tt.star, tt.name, tt.name) &&
        this.tokens.identifierNameAtIndex(index + 1) === 'as')
    ) {
      specifiers.push({
        type: 'ImportNamespaceSpecifier',
        local: {
          type: 'Identifier',
          name: this.tokens.identifierNameAtIndex(index + 2),
        },
      });
      index += 3;
    } else if (this.tokens.matches1AtIndex(index, tt.braceL)) {
      const ret = this.parseNamedImports(index);
      if (!ret) {
        return;
      }
      const [namedImports] = ret;
      specifiers.push(...namedImports);
      [, index] = ret;
    }
    if (
      this.tokens.matches2AtIndex(index, tt.name, tt.string) &&
      this.tokens.identifierNameAtIndex(index) === 'from'
    ) {
      this.importDeclarations.push({
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          raw: this.tokens.identifierNameAtIndex(index + 1),
          value: this.tokens.stringValueAtIndex(index + 1),
        },
        specifiers,
      });
    }
  }

  processTopLevelDeclaration() {
    const index = this.tokens.currentIndex();
    const identifier = this.tokens.identifierName();

    let declaration: DeclarationBinding;
    if (
      this.tokens.matches3AtIndex(index - 3, tt._async, tt._function, tt.star)
    ) {
      declaration = this.scanFunctionDeclaration(index - 3);
    } else if (
      this.tokens.matches2AtIndex(index - 2, tt._async, tt._function)
    ) {
      declaration = this.scanFunctionDeclaration(index - 2);
    } else if (this.tokens.matches2AtIndex(index - 2, tt._function, tt.star)) {
      declaration = this.scanFunctionDeclaration(index - 2);
    } else if (this.tokens.matches1AtIndex(index - 1, tt._function)) {
      declaration = this.scanFunctionDeclaration(index - 1);
    } else if (this.tokens.matches1AtIndex(index - 1, tt._class)) {
      declaration = this.scanClassDeclaration(index - 1);
    } else {
      declaration = this.scanVariableDeclarator(index);
    }
    this.binding.set(identifier, declaration);
  }

  scanClassDeclaration(startIndex: number): ClassDeclaration {
    let index = startIndex;
    let name = null;
    if (this.tokens.matches2AtIndex(index, tt._class, tt.name)) {
      name = this.tokens.identifierNameAtIndex(index + 1);
      index += 2;
    } else {
      index += 1;
    }
    return {
      type: 'ClassDeclaration',
      id: getIdentifier(name),
    };
  }

  scanFunctionDeclaration(startIndex: number): FunctionDeclaration {
    let index = startIndex;
    let async = false;
    let generator = false;
    // Probably due to a bug of Sucrase, the token type is unintentionally set to 'name'
    // so here compares by raw string
    const rawCode1 = this.tokens.identifierNameAtIndex(index);
    const rawCode2 = this.tokens.identifierNameAtIndex(index + 1);
    const rawCode3 = this.tokens.identifierNameAtIndex(index + 2);
    if (rawCode1 === 'async' && rawCode2 === 'function' && rawCode3 === '*') {
      index += 3;
      async = true;
      generator = true;
    } else if (rawCode1 === 'async' && rawCode2 === 'function') {
      index += 2;
      async = true;
    } else if (rawCode1 === 'function' && rawCode2 === '*') {
      index += 2;
      generator = true;
    } else {
      index += 1;
    }
    let name = null;
    if (this.tokens.matches1AtIndex(index, tt.name)) {
      name = this.tokens.identifierNameAtIndex(index);
      index += 1;
    }
    // Skip parenL
    index += 1;
    const [params] = this.parseFormalParameters(index) || [[]];
    return {
      type: 'FunctionDeclaration',
      id: getIdentifier(name),
      params,
      async,
      generator,
    };
  }

  scanVariableDeclarator(startIndex: number): VariableDeclarator {
    // Left hand can be assumed as an identifier
    const name = this.tokens.identifierNameAtIndex(startIndex);
    let init = null;
    if (this.tokens.matches1AtIndex(startIndex + 1, tt.eq)) {
      init = this.scanAssignmentExpression(startIndex + 2);
    }
    return {
      type: 'VariableDeclarator',
      id: {
        type: 'Identifier',
        name,
      },
      init,
    };
  }

  scanAssignmentExpression(startIndex: number): Expression {
    // Probably due to a bug of Sucrase, the token type is unintentionally set to 'name'
    // so here compares by raw string
    const rawCode1 = this.tokens.identifierNameAtIndex(startIndex);
    const rawCode2 = this.tokens.identifierNameAtIndex(startIndex + 1);
    if (
      (rawCode1 === 'async' && rawCode2 === 'function') ||
      rawCode1 === 'function'
    ) {
      return {
        ...this.scanFunctionDeclaration(startIndex),
        type: 'FunctionExpression',
      };
    } else if (this.tokens.matches1AtIndex(startIndex, tt._class)) {
      return {
        ...this.scanClassDeclaration(startIndex),
        type: 'ClassExpression',
      };
    } else {
      const unknownExpression = { type: 'UnknownExpression' } as const;
      let async = false;
      let index = startIndex;
      if (rawCode1 === 'async') {
        async = true;
        index += 1;
      }
      let params: Parameter[] = [];
      if (this.tokens.matches1AtIndex(index, tt.name)) {
        const name = this.tokens.identifierNameAtIndex(index);
        params = [
          {
            type: 'Identifier',
            name,
          },
        ];
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.parenL)) {
        // Skip parenL
        index += 1;
        const ret = this.parseFormalParameters(index);
        if (!ret) {
          return unknownExpression;
        }
        [params, index] = ret;
        // Skip parenR
        index += 1;
      } else {
        return unknownExpression;
      }
      if (this.tokens.matches1AtIndex(index, tt.arrow)) {
        return {
          type: 'ArrowFunctionExpression',
          generator: false,
          id: null,
          params,
          async,
        };
      } else {
        return unknownExpression;
      }
    }
  }

  // Note that it also accepts VariableStatement
  parseDeclaration(
    startIndex: number,
  ): FunctionDeclaration | ClassDeclaration | VariableDeclaration | null {
    let index = startIndex;
    const rawCode1 = this.tokens.identifierNameAtIndex(index);
    const rawCode2 = this.tokens.identifierNameAtIndex(index + 1);
    if (
      rawCode1 === 'function' ||
      (rawCode1 === 'async' && rawCode2 === 'function')
    ) {
      return this.scanFunctionDeclaration(index);
    } else if (this.tokens.matches1AtIndex(index, tt._class)) {
      return this.scanClassDeclaration(index);
    } else if (
      this.tokens.matches1AtIndex(index, tt._const) ||
      this.tokens.matches1AtIndex(index, tt._let) ||
      this.tokens.matches1AtIndex(index, tt._var)
    ) {
      const kind = this.tokens.identifierNameAtIndex(index) as
        | 'const'
        | 'let'
        | 'var';
      const declarations: VariableDeclarator[] = [];
      // Skip const/let/var at the first time,
      // then repeat scanning LexicalBinding/VariableDeclaration until comma doesn't match
      do {
        index += 1;
        declarations.push(this.scanVariableDeclarator(index));
        index = this.skipBindingElement(index);
      } while (this.tokens.matches1AtIndex(index, tt.comma));
      return {
        type: 'VariableDeclaration',
        declarations,
        kind,
      };
    } else {
      return null;
    }
  }

  parseFormalParameters(startIndex: number): [Parameter[], number] | null {
    const parameters: Parameter[] = [];
    let currentBindingName: BindingName | null = null;
    let isRestParam = false;
    let isAssignment = false;
    const resolveParam = () => {
      if (currentBindingName) {
        const parameter: Parameter = isRestParam
          ? {
              type: 'RestElement',
              argument: currentBindingName,
            }
          : isAssignment
          ? {
              type: 'AssignmentPattern',
              left: currentBindingName,
            }
          : currentBindingName;
        parameters.push(parameter);
      }
      currentBindingName = null;
      isRestParam = false;
      isAssignment = false;
    };
    let index = startIndex;
    while (!this.tokens.matches1AtIndex(index, tt.parenR)) {
      if (this.tokens.matches1AtIndex(index, tt.comma)) {
        resolveParam();
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.ellipsis)) {
        isRestParam = true;
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.name)) {
        currentBindingName = getIdentifier(
          this.tokens.identifierNameAtIndex(index),
        );
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.braceL)) {
        const ret = this.parseObjectBindingPattern(index);
        if (!ret) {
          return null;
        }
        [currentBindingName, index] = ret;
      } else if (this.tokens.matches1AtIndex(index, tt.bracketL)) {
        const ret = this.parseArrayBindingPattern(index);
        if (!ret) {
          return null;
        }
        [currentBindingName, index] = ret;
      } else if (this.tokens.matches1AtIndex(index, tt.eq)) {
        isAssignment = true;
        index = this.skipInitializer(index);
      } else {
        return null;
      }
    }
    resolveParam();
    return [parameters, index];
  }

  parseObjectBindingPattern(
    startIndex: number,
  ): [ObjectPattern, number] | null {
    const properties: (Property | RestElement)[] = [];
    let currentProperty: Property | null = null;
    const resolveParam = () => {
      if (currentProperty) {
        properties.push(currentProperty);
      }
      currentProperty = null;
    };
    let index = startIndex;
    // Skip braceL
    index += 1;
    while (!this.tokens.matches1AtIndex(index, tt.braceR)) {
      if (this.tokens.matches1AtIndex(index, tt.comma)) {
        resolveParam();
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.ellipsis)) {
        properties.push({
          type: 'RestElement',
          argument: {
            type: 'Identifier',
            name: this.tokens.identifierNameAtIndex(index + 1),
          },
        });
        currentProperty = null;
        index += 2;
      } else if (this.tokens.matches1AtIndex(index, tt.name)) {
        const name = this.tokens.identifierNameAtIndex(index);
        currentProperty = {
          type: 'Property',
          key: {
            type: 'Identifier',
            name,
          },
          computed: false,
          method: false,
          shorthand: true,
          kind: 'init',
        };
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.string)) {
        const raw = this.tokens.identifierNameAtIndex(index);
        const value = this.tokens.stringValueAtIndex(index);
        currentProperty = {
          type: 'Property',
          key: {
            type: 'Literal',
            value,
            raw,
          },
          computed: false,
          method: false,
          shorthand: false,
          kind: 'init',
        };
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.num)) {
        const raw = this.tokens.identifierNameAtIndex(index);
        const value = Number(raw);
        currentProperty = {
          type: 'Property',
          key: {
            type: 'Literal',
            value,
            raw,
          },
          computed: false,
          method: false,
          shorthand: false,
          kind: 'init',
        };
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.bracketL)) {
        index = this.skipComputedPropertyName(index);
      } else if (this.tokens.matches1AtIndex(index, tt.eq)) {
        index = this.skipInitializer(index);
      } else if (this.tokens.matches1AtIndex(index, tt.colon)) {
        if (currentProperty) {
          currentProperty.shorthand = false;
        }
        index = this.skipBindingElement(index + 1);
      } else {
        return null;
      }
    }
    resolveParam();
    // Skip braceR
    index += 1;
    return [
      {
        type: 'ObjectPattern',
        properties,
      },
      index,
    ];
  }

  parseArrayBindingPattern(startIndex: number): [ArrayPattern, number] | null {
    const elements: (DestructuringPattern | null)[] = [];
    let currentBindingName: BindingName | null = null;
    let isRestParam = false;
    let isAssignment = false;
    const resolveParam = () => {
      if (currentBindingName) {
        const parameter: Parameter = isRestParam
          ? {
              type: 'RestElement',
              argument: currentBindingName,
            }
          : isAssignment
          ? {
              type: 'AssignmentPattern',
              left: currentBindingName,
            }
          : currentBindingName;
        elements.push(parameter);
      } else {
        elements.push(null);
      }
      currentBindingName = null;
      isRestParam = false;
      isAssignment = false;
    };
    let index = startIndex;
    // Skip bracketL
    index += 1;
    while (!this.tokens.matches1AtIndex(index, tt.bracketR)) {
      if (this.tokens.matches1AtIndex(index, tt.comma)) {
        resolveParam();
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.ellipsis)) {
        isRestParam = true;
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.name)) {
        currentBindingName = getIdentifier(
          this.tokens.identifierNameAtIndex(index),
        );
        index += 1;
      } else if (this.tokens.matches1AtIndex(index, tt.braceL)) {
        const ret = this.parseObjectBindingPattern(index);
        if (!ret) {
          return null;
        }
        [currentBindingName, index] = ret;
      } else if (this.tokens.matches1AtIndex(index, tt.bracketL)) {
        const ret = this.parseArrayBindingPattern(index);
        if (!ret) {
          return null;
        }
        [currentBindingName, index] = ret;
      } else if (this.tokens.matches1AtIndex(index, tt.eq)) {
        isAssignment = true;
        index = this.skipInitializer(index);
      } else {
        return null;
      }
    }
    resolveParam();
    // Skip bracketR
    index += 1;
    return [
      {
        type: 'ArrayPattern',
        elements,
      },
      index,
    ];
  }

  parseNamedExports(startIndex: number): [ExportSpecifier[], number] | null {
    const ret = this.parseNamedModules(startIndex);
    if (!ret) {
      return null;
    }
    const [moduleList, index] = ret;
    return [
      moduleList.map(([local, exported]) => ({
        type: 'ExportSpecifier',
        local,
        exported,
      })),
      index,
    ];
  }

  parseNamedImports(startIndex: number): [ImportSpecifier[], number] | null {
    const ret = this.parseNamedModules(startIndex);
    if (!ret) {
      return null;
    }
    const [moduleList, index] = ret;
    return [
      moduleList.map(([local, imported]) => ({
        type: 'ImportSpecifier',
        local,
        imported,
      })),
      index,
    ];
  }

  parseNamedModules(
    startIndex: number,
  ): [[Identifier, Identifier][], number] | null {
    const moduleList: [Identifier, Identifier][] = [];
    let index = startIndex;
    // Skip braceL
    index += 1;
    while (!this.tokens.matches1AtIndex(index, tt.braceR)) {
      if (this.tokens.matches1AtIndex(index, tt.comma)) {
        index += 1;
      } else if (
        this.tokens.matches3AtIndex(index, tt.name, tt._as, tt.name) ||
        // 'as' keyword is unintentionally set to 'name'
        this.tokens.matches3AtIndex(index, tt.name, tt.name, tt.name)
      ) {
        if (this.tokens.identifierNameAtIndex(index + 1) !== 'as') {
          return null;
        }
        moduleList.push([
          {
            type: 'Identifier',
            name: this.tokens.identifierNameAtIndex(index),
          },
          {
            type: 'Identifier',
            name: this.tokens.identifierNameAtIndex(index + 2),
          },
        ]);
        index += 3;
      } else if (this.tokens.matches1AtIndex(index, tt.name)) {
        moduleList.push([
          {
            type: 'Identifier',
            name: this.tokens.identifierNameAtIndex(index),
          },
          {
            type: 'Identifier',
            name: this.tokens.identifierNameAtIndex(index),
          },
        ]);
        index += 1;
      } else {
        return null;
      }
    }
    // Skip braceR
    index += 1;
    return [moduleList, index];
  }

  skipInitializer(startIndex: number): number {
    let index = startIndex;
    // Skip eq
    index += 1;
    index = this.skipUntil(index, [
      tt.eq,
      tt.braceR,
      tt.parenR,
      tt.bracketR,
      tt.comma,
      tt.semi,
    ]);
    return index;
  }

  skipComputedPropertyName(startIndex: number): number {
    let index = startIndex;
    // Skip bracketL
    index += 1;
    index = this.skipUntil(index, [tt.bracketR, tt.semi]);
    // Skip bracketR
    index += 1;
    return index;
  }

  skipBindingElement(startIndex: number): number {
    let index = startIndex;
    index = this.skipUntil(index, [
      tt.braceR,
      tt.parenR,
      tt.bracketR,
      tt.comma,
      tt.semi,
    ]);
    return index;
  }

  skipUntil(startIndex: number, stopTokens: tt[]): number {
    const { tokens } = this.tokens;
    const startScopeDepth = tokens[startIndex].scopeDepth;
    let index = startIndex;
    let inTemplate = false;

    while (!this.tokens.matches1AtIndex(index, tt.eof)) {
      if (startScopeDepth < tokens[index].scopeDepth) {
        index += 1;
        continue;
      }
      if (stopTokens.includes(tokens[index].type)) {
        return index;
      }
      if (this.tokens.matches1AtIndex(index, tt.backQuote)) {
        inTemplate = !inTemplate;
      } else if (
        inTemplate &&
        this.tokens.matches1AtIndex(index, tt.dollarBraceL)
      ) {
        index = this.skipUntil(index + 1, [tt.braceR]);
      } else if (this.tokens.matches1AtIndex(index, tt.braceL)) {
        index = this.skipUntil(index + 1, [tt.braceR]);
      } else if (this.tokens.matches1AtIndex(index, tt.parenL)) {
        index = this.skipUntil(index + 1, [tt.parenR]);
      } else if (this.tokens.matches1AtIndex(index, tt.bracketL)) {
        index = this.skipUntil(index + 1, [tt.bracketR]);
      }
      index += 1;
    }
    return index;
  }
}
