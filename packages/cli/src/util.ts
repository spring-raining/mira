import globby from 'globby';

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/flow-typed/**',
  '**/coverage/**',
  '**/.git',
];

export async function globFiles({
  patterns,
  cwd,
  gitignore = false,
  absolute = false,
}: {
  patterns: string | readonly string[]
  cwd: string;
  gitignore?: boolean;
  absolute?: boolean;
}): Promise<string[]> {
  return await globby(patterns, {
    ignore: DEFAULT_IGNORE,
    cwd,
    gitignore,
    absolute,
  });
}
