import { injectable, inject } from 'tsyringe';
import 'reflect-metadata';

export const cliServiceToken = 'CliService';

export interface CliRepository {
  getAsteroidFiles(): Promise<string[]>;
}

@injectable()
export class CliService {
  constructor(public service: CliRepository) {}
}
