import { atom } from 'recoil';
import { Brick, AsteroidId } from '../types';

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
