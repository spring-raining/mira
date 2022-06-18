import { parse } from '../vendor/sucrase/parser';
import { Scanner } from './scanner';
import {
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  ImportDeclaration,
} from './types';

export async function parseModuleDeclarations(source: string): Promise<{
  exportDeclarations: Array<
    ExportAllDeclaration | ExportDefaultDeclaration | ExportNamedDeclaration
  >;
  importDeclarations: ImportDeclaration[];
}> {
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);
  scanner.scan();
  const { exportDeclarations, importDeclarations } = scanner;
  return {
    exportDeclarations,
    importDeclarations,
  };
}
