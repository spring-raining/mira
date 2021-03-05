import { parseArgs } from './commands';
import { startAsteroidServer } from './server';

export function main() {
  const args = parseArgs();
  startAsteroidServer(args);
};
