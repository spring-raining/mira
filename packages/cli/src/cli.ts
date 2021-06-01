import { parseArgs } from './commands';
import { startServer } from './server';

export function main() {
  const args = parseArgs();
  startServer(args);
}
