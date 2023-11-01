import {verbose} from '@appland/action-utils';
import {randomUUID} from 'crypto';
import {mkdtempSync} from 'fs';
import {cp, rm} from 'fs/promises';
import {join} from 'path';

if (process.env.VERBOSE) verbose(true);

export const Cwd = process.cwd();
export const FixtureDir = join(__dirname, 'fixture');

export function makeWorkDir(): string {
  return mkdtempSync(join(__dirname, 'work', 'archive-appmap-action-'));
}

export class ArchiveTestContext {
  fixtureDir = FixtureDir;
  workDir = makeWorkDir();
  archiveBranch = randomUUID();
  currentBranch?: string;

  constructor() {}

  async setup(): Promise<void> {
    await cp(this.fixtureDir, this.workDir, {recursive: true, force: true});
  }

  async teardown(): Promise<void> {
    process.chdir(Cwd);
    await rm(this.workDir, {recursive: true, force: true});
  }
}
