import { transform, Loader } from 'esbuild';

export interface EsbuildConfig {
  loaders: Record<string, Loader>;
  target: string | string[];
  handledExtensions: string[];
  tsFileExtensions: string[];
  jsxFactory?: string;
  jsxFragment?: string;
  define?: { [key: string]: string };
}
