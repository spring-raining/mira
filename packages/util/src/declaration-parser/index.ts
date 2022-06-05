import { parse } from '../vendor/sucrase/parser';
import { Scanner } from './scanner';
import {
  ClassDeclaration,
  FunctionDeclaration,
  VariableDeclaration,
  VariableDeclarator,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from './types';

export async function scanDeclarations(source: string): Promise<{
  binding: Map<
    string,
    VariableDeclarator | FunctionDeclaration | ClassDeclaration
  >;
  topLevelDeclarations: Array<
    VariableDeclaration | FunctionDeclaration | ClassDeclaration
  >;
  exportDeclarations: Array<
    ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration
  >;
  importDeclarations: ImportDeclaration[];
}> {
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);
  scanner.scan();
  const {
    binding,
    topLevelDeclarations,
    exportDeclarations,
    importDeclarations,
  } = scanner;
  return {
    binding,
    topLevelDeclarations,
    exportDeclarations,
    importDeclarations,
  };
}
