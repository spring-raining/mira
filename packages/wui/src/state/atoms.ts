import { atom } from 'recoil';
import { Brick, Mira, EvaluatedResult, MiraWuiConfig } from '../types';

export const wuiConfigState = atom<MiraWuiConfig>({
  key: 'wuiConfigState',
  default: {} as MiraWuiConfig, // Should be initialized
});

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

export const selectedBrickIdsState = atom<string[]>({
  key: 'selectedBrickIdsState',
  default: [],
});

export const brickSyntaxErrorState = atom<
  Record<Brick['id'], { error: Error; parsedText: string }>
>({
  key: 'brickSyntaxErrorState',
  default: {},
});

export const brickModuleImportErrorState = atom<Record<Brick['id'], Error>>({
  key: 'brickModuleImportErrorState',
  default: {},
});

export const brickTextSwapState = atom<
  Record<Brick['id'], { text: string; mira?: Mira } | undefined>
>({
  key: 'brickTextSwapState',
  default: {},
});

export const miraEvaluatedDataDictState = atom<Record<string, EvaluatedResult>>(
  {
    key: 'miraEvaluatedDataDictState',
    default: {},
  },
);
