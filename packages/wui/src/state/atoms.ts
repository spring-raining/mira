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

export const asteroidImportDefinitionDictState = atom<Record<string, ParsedImportStatement>>({
  key: 'asteroidImportDefinitionDictState',
  default: {},
});

export const asteroidImportedValueByStatementDictState = atom<Record<string, Record<string, unknown>>>({
  key: 'asteroidImportedValueByStatementDictState',
  default: {},
});

export const asteroidImportErrorState = atom<Record<Brick['brickId'], Error>>({
  key: 'asteroidImportErrorState',
  default: {},
});
