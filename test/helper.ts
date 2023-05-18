import {join} from 'path';
import verbose from '../src/verbose';
import {mkdtempSync} from 'fs';
import {MockArtifactStore} from './MockArtifactStore';
import {NoCacheStore} from './NoCacheStore';
import {MockArchiveCommand} from './MockArchiveCommand';
import {randomUUID} from 'crypto';
import {executeCommand} from '../src/executeCommand';
import {cp} from 'fs/promises';
import {rm} from 'fs/promises';

if (process.env.VERBOSE) verbose(true);

export const Cwd = process.cwd();
export const FixtureDir = join(__dirname, 'fixture');

export function makeWorkDir(): string {
  return mkdtempSync(join(__dirname, 'work', 'archive-appmap-action-'));
}

export class ArchiveTestContext {
  artifactStore = new MockArtifactStore();
  noCacheStore = new NoCacheStore();
  archiveCommand = new MockArchiveCommand();
  workDir = makeWorkDir();
  archiveBranch = randomUUID();
  currentBranch?: string;

  async setup(): Promise<void> {
    await cp(FixtureDir, this.workDir, {recursive: true, force: true});
    process.chdir(this.workDir);

    this.currentBranch = (await executeCommand('git rev-parse --abbrev-ref HEAD')).trim();
    // In a GitHub PR
    if (this.currentBranch === 'HEAD')
      this.currentBranch = (await executeCommand('git rev-parse HEAD')).trim();

    await executeCommand(`git checkout -b ${this.archiveBranch}`);
    await executeCommand(`git checkout ${this.currentBranch}`);
  }

  async teardown(): Promise<void> {
    await executeCommand(`git checkout ${this.currentBranch}`);
    await executeCommand(`git branch -D ${this.archiveBranch}`);

    process.chdir(Cwd);

    await rm(this.workDir, {recursive: true, force: true});

    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.resetAllMocks();
  }
}
