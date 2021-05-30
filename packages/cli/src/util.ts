import globby from 'globby';

export const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/flow-typed/**',
  '**/coverage/**',
  '**/.git/**',
];

export async function globFiles({
  includes,
  excludes = [],
  cwd,
  gitignore = false,
  absolute = true,
}: {
  includes: readonly string[];
  excludes?: readonly string[];
  cwd: string;
  gitignore?: boolean;
  absolute?: boolean;
}): Promise<string[]> {
  return await globby(includes, {
    ignore: [...DEFAULT_IGNORE, ...excludes],
    cwd,
    gitignore,
    absolute,
  });
}
