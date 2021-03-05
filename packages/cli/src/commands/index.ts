import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import camelCase from 'camelcase';

export interface CliArgs {
  port: number;
  rootDir: string;
};

const options = [
  {
    name: 'port',
    alias: 'p',
    type: Number,
    defaultValue: 25143,
  },
  {
    name: 'root-dir',
    alias: 'r',
    type: String,
    defaultValue: process.cwd(),
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
  },
];

export function parseArgs({ argv = process.argv }: { argv?: string[] } = {}): CliArgs {
  const args = commandLineArgs(options, { argv, partial: true });
  if ('help' in args) {
    console.log(commandLineUsage({ header: 'Options', optionList: options }));
    process.exit(0);
  }
  return Object.entries(args).reduce((prev, [k, v]) => ({
    ...prev,
    [camelCase(k)]: v,
  }), {}) as CliArgs;
}
