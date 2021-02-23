import { startService, Service, ServiceOptions } from 'esbuild-wasm';
import { defaultConfig } from './config';

export type { Service, ServiceOptions };

export async function init(
  config: ServiceOptions = defaultConfig
): Promise<Service> {
  const service = await startService(config);
  return service;
}
