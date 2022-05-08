import { nanoid } from 'nanoid/non-secure';
import { BrickId, MiraId, EnvironmentId, CalleeId } from './types';

export const cancellable = (fn: () => void, ms = 100) => {
  const timer = setTimeout(fn, ms);
  return () => {
    clearTimeout(timer);
  };
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noopAsync = async () => {};

export const genBrickId = (): BrickId => `brick.${nanoid()}`;

export const genMiraId = (): MiraId => `mira.${nanoid()}`;

export const genRunEnvId = (): EnvironmentId => `env.${nanoid()}`;

export const genCalleeId = (): CalleeId => `fn.${nanoid()}`;
