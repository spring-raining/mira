import { atom } from 'recoil';
import { MiraMdxFileItem } from '../types/workspace';

export const miraFilesState = atom<MiraMdxFileItem[]>({
  key: 'miraFilesState',
  default: [],
});

export const activeFilePathState = atom<string | null>({
  key: 'activeFilePathState',
  default: null,
});
