import { atom } from 'recoil';
import { Brick, MiraId, EvaluatedResult } from '../types';

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

export const selectedBrickIdsState = atom<string[]>({
  key: 'selectedBrickIdsState',
  default: [],
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

export const miraImportErrorDictState = atom<Record<Brick['id'], Error>>({
  key: 'miraImportErrorDictState',
  default: {},
});

export const miraEvaluatedDataDictState = atom<Record<string, EvaluatedResult>>(
  {
    key: 'miraEvaluatedDataDictState',
    default: {},
  }
);
