import { atom } from 'recoil';
import { AsteroidFileItem } from '../types/workspace';

export const asteroidFilesState = atom<AsteroidFileItem[]>({
  key: 'asteroidFilesState',
  default: [],
});

export const activeFilePathState = atom<string | null>({
  key: 'activeFilePathState',
  default: null,
});
