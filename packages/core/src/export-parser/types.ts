export interface ArrayPattern {
  type: 'ArrayPattern';
  elements: (DestructuringPattern | null)[];
}
export interface ArrowFunctionExpression {
  type: 'ArrowFunctionExpression';
  generator: boolean;
  id: null;
  params: Parameter[];
  // body: BlockStatement | Expression;
  async: boolean;
  // expression: boolean;
}
export interface AssignmentPattern {
  type: 'AssignmentPattern';
  left: BindingName;
  // right: Expression;
}
export type BindingName = BindingPattern | Identifier;
export type BindingPattern = ArrayPattern | ObjectPattern;
interface ClassDeclarationBase {
  id: Identifier | null;
  // body: ClassBody;
  // superClass: LeftHandSideExpression;
}
export interface ClassDeclaration extends ClassDeclarationBase {
  type: 'ClassDeclaration';
}
export interface ClassExpression extends ClassDeclarationBase {
  type: 'ClassExpression';
}
export type DestructuringPattern =
  | ArrayPattern
  | AssignmentPattern
  | Identifier
  // | MemberExpression
  | ObjectPattern
  | RestElement;
export type Expression =
  // Only parse function and class expression for now
  | ArrowFunctionExpression
  | ClassExpression
  | FunctionExpression
  | { type: 'UnknownExpression' };
export interface ExportAllDeclaration {
  type: 'ExportAllDeclaration';
  source: StringLiteral | null;
  exported: Identifier | null;
  // assertions: ImportAttribute[];
}
export type ExportDeclaration =
  | ClassDeclaration
  | ClassExpression
  | FunctionDeclaration
  | VariableDeclaration;
export interface ExportDefaultDeclaration {
  type: 'ExportDefaultDeclaration';
  declaration: ExportDeclaration | Expression;
}
export interface ExportNamedDeclaration {
  type: 'ExportNamedDeclaration';
  declaration: ExportDeclaration | null;
  specifiers: ExportSpecifier[];
  source: StringLiteral | null;
  // assertions: ImportAttribute[];
}
export interface ExportSpecifier {
  type: 'ExportSpecifier';
  local: Identifier;
  exported: Identifier;
}
export interface FunctionDeclaration extends FunctionDeclarationBase {
  type: 'FunctionDeclaration';
  // body: BlockStatement;
}
interface FunctionDeclarationBase {
  id: Identifier | null;
  generator: boolean;
  // expression: boolean;
  async: boolean;
  params: Parameter[];
}
export interface FunctionExpression extends FunctionDeclarationBase {
  type: 'FunctionExpression';
  // body: BlockStatement;
}
export interface Identifier {
  type: 'Identifier';
  name: string;
}
interface LiteralBase {
  type: 'Literal';
  raw: string;
  value: RegExp | bigint | boolean | number | string | null;
}
export interface NumberLiteral extends LiteralBase {
  value: number;
}
export interface ObjectPattern {
  type: 'ObjectPattern';
  properties: (Property | RestElement)[];
}
export type Parameter =
  | ArrayPattern
  | AssignmentPattern
  | Identifier
  | ObjectPattern
  | RestElement;
export type Property =
  // | PropertyComputedName
  PropertyNonComputedName;
interface PropertyBase {
  type: 'Property';
  key: PropertyName;
  // value: AssignmentPattern | BindingName | Expression;
  computed: boolean;
  method: boolean;
  shorthand: boolean;
  kind: 'get' | 'init' | 'set';
}
export type PropertyName =
  // | PropertyNameComputed
  PropertyNameNonComputed;
export type PropertyNameNonComputed =
  | Identifier
  | NumberLiteral
  | StringLiteral;
export interface PropertyNonComputedName extends PropertyBase {
  key: PropertyNameNonComputed;
  computed: false;
}
export interface RestElement {
  type: 'RestElement';
  argument: DestructuringPattern;
}
export interface StringLiteral extends LiteralBase {
  value: string;
}
export interface VariableDeclaration {
  type: 'VariableDeclaration';
  declarations: VariableDeclarator[];
  kind: 'const' | 'let' | 'var';
}
export interface VariableDeclarator {
  type: 'VariableDeclarator';
  id: BindingName;
  init: Expression | null;
}

export type DeclarationBinding =
  | ClassDeclaration
  | FunctionDeclaration
  | VariableDeclarator;
