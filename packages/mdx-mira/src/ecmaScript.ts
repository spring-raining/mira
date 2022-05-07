import { ImportDefinition } from './types';

export const stringifyImportDefinition = (def: ImportDefinition) => {
  let statement = 'import';
  if (def.all) {
    statement += ` ${JSON.stringify(def.specifier)};`;
  } else {
    const defaultBinding = def.default && def.importBinding['default'];
    if (defaultBinding) {
      statement += ` ${defaultBinding}`;
    }
    if (def.namespaceImport) {
      statement += `${defaultBinding ? ',' : ''} * as ${def.namespaceImport}`;
    }
    const importList = def.named.map((name) =>
      name !== def.importBinding[name]
        ? `${name} as ${def.importBinding[name]}`
        : name,
    );
    if (importList.length > 0) {
      statement += `${defaultBinding ? ',' : ''} { ${importList.join(', ')} }`;
    }
    statement += ` from ${JSON.stringify(def.specifier)};`;
  }
  return statement;
};
