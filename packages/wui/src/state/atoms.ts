import { atom } from 'recoil';
import { Brick, AsteroidId, ParsedImportStatement } from '../types';

export const brickDictState = atom<Record<string, Brick>>({
  key: 'brickDictState',
  default: {},
});

export const brickOrderState = atom<string[]>({
  key: 'brickOrderState',
  default: [],
});

export const activeBrickIdState = atom<string | null>({
  key: 'activeBrickIdState',
  default: null,
});

export const asteroidDeclaredValueDictState = atom<Record<string, unknown>>({
  key: 'asteroidDeclaredValueDictState',
  default: {},
});

export const asteroidValuesExportedState = atom<Record<AsteroidId, string[]>>({
  key: 'asteroidValuesExportedState',
  default: {},
});

export const importedModulesRefDictState = atom<Record<string, string>>({
  key: 'importedModulesDictState',
  default: {},
});

export const asteroidImportMappingState = atom<
  Record<string, { specifier: string; name: string | null }>
>({
  key: 'asteroidImportMappingState',
  default: {},
});

export const asteroidImportErrorDictState = atom<
  Record<Brick['brickId'], Error>
>({
  key: 'asteroidImportErrorDictState',
  default: {},
});
