import path from 'path';
import { codeFrameColumns } from '@babel/code-frame';
import { Logger, PluginSyntaxError } from '@web/dev-server-core';
import chalk from 'chalk';

export class ServerLogger implements Logger {
  private debugLogging: boolean;
  private onSyntaxError: (msg: string) => void;

  constructor(debugLogging: boolean, onSyntaxError: (msg: string) => void) {
    this.debugLogging = debugLogging;
    this.onSyntaxError = onSyntaxError;
  }

  log(...messages: unknown[]) {
    console.log(...messages);
  }

  debug(...messages: unknown[]) {
    if (this.debugLogging) {
      console.debug(...messages);
    }
  }

  error(...messages: unknown[]) {
    console.error(...messages);
  }

  warn(...messages: unknown[]) {
    console.warn(...messages);
  }

  group() {
    console.group();
  }

  groupEnd() {
    console.groupEnd();
  }

  logSyntaxError(error: PluginSyntaxError) {
    const { message, code, filePath, column, line } = error;
    const highlightedResult = codeFrameColumns(
      code,
      { start: { line, column } },
      { highlightCode: true },
    );
    const result = codeFrameColumns(
      code,
      { start: { line, column } },
      { highlightCode: false },
    );

    const relativePath = path.relative(process.cwd(), filePath);
    console.error(
      chalk.red(
        `Error while transforming ${chalk.cyanBright(
          relativePath,
        )}: ${message}\n`,
      ),
    );
    console.error(highlightedResult);
    console.error('');

    this.onSyntaxError(
      `Error while transforming ${relativePath}: ${message}` +
        `\n\n${result}\n\n`,
    );
  }
}
