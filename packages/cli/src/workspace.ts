import { CliRepository } from '@asteroid-mdx/cli-workspace';
import { CliArgs } from './commands';
import { globFiles } from './util';

export const getCliRepository = ({
  rootDir,
}: Pick<CliArgs, 'rootDir'>): CliRepository => {
  return {
    getAsteroidFiles: async () => {
      return await globFiles({
        patterns: '**/*.mdx',
        cwd: rootDir,
        gitignore: true,
      });
    },
  };
};
