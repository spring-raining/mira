import { atom } from 'recoil';
import {
  Brick,
  LiteralBrickData,
  EvaluateState,
  MiraWuiConfig,
  BrickId,
  MiraId,
} from '../types';

export const wuiConfigState = atom<MiraWuiConfig>({
  key: 'wuiConfigState',
  default: {} as MiraWuiConfig, // Should be initialized
});

export const brickDictState = atom<Record<BrickId, Brick>>({
  key: 'brickDictState',
  default: {},
});

export const brickOrderState = atom<BrickId[]>({
  key: 'brickOrderState',
  default: [],
});

export const activeBrickIdState = atom<BrickId | null>({
  key: 'activeBrickIdState',
  default: null,
});

export const focusedBrickIdState = atom<BrickId | null>({
  key: 'focusedBrickIdState',
  default: null,
});

export const selectedBrickIdsState = atom<BrickId[]>({
  key: 'selectedBrickIdsState',
  default: [],
});

export const brickParseErrorState = atom<
  Record<BrickId, { error: Error; parsedText: string }>
>({
  key: 'brickParseErrorState',
  default: {},
});

export const brickModuleImportErrorState = atom<Record<string, Error>>({
  key: 'brickModuleImportErrorState',
  default: {},
});

export const brickTextSwapState = atom<
  Record<BrickId, LiteralBrickData | undefined>
>({
  key: 'brickTextSwapState',
  default: {},
});

export const miraRenderParamsDictState = atom<
  Record<BrickId, Map<string, unknown>>
>({
  key: 'miraRenderParamsDictState',
  default: {},
});

export const miraEvaluateStateDictState = atom<Record<MiraId, EvaluateState>>({
  key: 'miraEvaluateStateDictState',
  default: {},
});
