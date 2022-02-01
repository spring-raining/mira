import { parse } from 'sucrase/dist/parser';
import { Scanner } from './scanner';

export const scanExports = (source: string) => {
  const { tokens } = parse(source, false, false, false);
  const scanner = new Scanner(source, tokens);
  scanner.scan();
  return scanner;
};
