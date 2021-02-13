import { parseImportDeclaration, importModules } from '@asteroid-mdx/core';
import { ImportPart, ImportDefinition } from '../contexts/universe';
import { ScriptNote, ASTNode } from '.';

export const collectImports = (scripts: ScriptNote[]): ImportPart[] => {
  type ImportASTNode = ASTNode & {
    type: 'import';
    value: string;
  };
  const imports = scripts
    .reduce<ASTNode[]>((acc, { children }) => [...acc, ...children], [])
    .filter<ImportASTNode>(
      (node): node is ImportASTNode => node.type === 'import'
    );

  const collection = imports.map<ImportPart>(
    ({ id, value }: { id: string; value: string }) => ({
      id,
      text: value,
      definitions: value
        .split('\n')
        .map((term) => parseImportDeclaration(term))
        .filter<ImportDefinition>((v): v is ImportDefinition => !!v),
    })
  );
  return collection;
};

export const loadModule = async (
  importPart: ImportPart
): Promise<ImportPart> => {
  try {
    const modules = await importModules(importPart.definitions);
    return { ...importPart, modules };
  } catch (error) {
    return { ...importPart, importError: error };
  }
};
