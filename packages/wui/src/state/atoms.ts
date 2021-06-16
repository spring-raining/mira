import { atom } from 'recoil';
import { Brick, MiraId } from '../types';

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

export const focusedBrickIdState = atom<string | null>({
  key: 'focusedBrickIdState',
  default: null,
});

export const inViewBrickIdsState = atom<string[]>({
  key: 'inViewBrickIdsState',
  default: [],
});

export const miraDeclaredValueDictState = atom<Record<string, unknown>>({
  key: 'miraDeclaredValueDictState',
  default: {},
});

export const miraValuesExportedState = atom<Record<MiraId, string[]>>({
  key: 'miraValuesExportedState',
  default: {},
});

export const importedModulesRefDictState = atom<Record<string, string>>({
  key: 'importedModulesDictState',
  default: {},
});

export const miraImportMappingState = atom<
  Record<string, { specifier: string; name: string | null }>
>({
  key: 'miraImportMappingState',
  default: {},
});

export const miraImportErrorDictState = atom<Record<Brick['brickId'], Error>>({
  key: 'miraImportErrorDictState',
  default: {},
});
