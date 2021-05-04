import path from 'path';
import next from 'next';
import type createServer from 'next/dist/server/next';
import { NextServer } from 'next/dist/server/next';
import { container } from 'tsyringe';
import { cliServiceToken, CliRepository, CliService } from '../services/cli';

export type { CliRepository };

export default (
  { cliRepository }: { cliRepository: CliRepository },
  options: Parameters<typeof createServer>[0] = {}
): {
  app: NextServer;
} => {
  container.register(cliServiceToken, {
    useValue: new CliService(cliRepository),
  });
  return {
    app: next({
      dir: path.resolve(__dirname, '..'),
      ...options,
    }),
  };
};
