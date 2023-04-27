import {randomUUID} from 'crypto';
import Archiver, {ArtifactStore} from '../src/Archiver';
import {executeCommand} from '../src/executeCommand';
import * as test from './helper';
import {cp, rm} from 'fs/promises';

class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string>();

  async uploadArtifact(name: string, path: string): Promise<void> {
    this.artifacts.set(name, path);
  }
}

describe('archive-appmap-action', () => {
  let artifactStore: MockArtifactStore;
  let archiveBranch: string;
  let currentBranch: string;

  const checkoutBranch = async () => {
    archiveBranch = randomUUID();
    currentBranch = (await executeCommand('git rev-parse --abbrev-ref HEAD')).trim();
    // In a GitHub PR
    if (currentBranch === 'HEAD')
      currentBranch = (await executeCommand('git rev-parse HEAD')).trim();

    await executeCommand(`git checkout -b ${archiveBranch}`);
    await executeCommand(`git checkout ${currentBranch}`);
  };

  const cleanupBranch = async () => {
    await executeCommand(`git checkout ${currentBranch}`);
    await executeCommand(`git branch -D ${archiveBranch}`);
  };
  let workDir: string;

  beforeEach(() => (artifactStore = new MockArtifactStore()));
  beforeEach(() => (workDir = test.makeWorkDir()));
  beforeEach(() => cp(test.fixtureDir, workDir, {recursive: true, force: true}));
  beforeEach(() => process.chdir(workDir));
  beforeEach(checkoutBranch);

  afterEach(cleanupBranch);
  afterEach(() => process.chdir(test.pwd));
  afterEach(() => rm(workDir, {recursive: true, force: true}));

  it('build and store an AppMap archive', async () => {
    const archiver = new Archiver(artifactStore);
    archiver.toolsPath = './archive';
    archiver.archiveBranch = archiveBranch;
    archiver.commit = true;
    archiver.push = false;
    await archiver.archive();

    expect([...artifactStore.artifacts.keys()].sort()).toEqual(['appmap-archive-full_402dec8.tar']);
    expect(artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
      '.appmap/archive/full/402dec8.tar'
    );
  });

  it('assign the archive to an arbitrary revision', async () => {
    const archiver = new Archiver(artifactStore);
    archiver.toolsPath = './archive';
    archiver.archiveBranch = archiveBranch;
    archiver.revision = 'foobar';
    await archiver.archive();

    expect([...artifactStore.artifacts.keys()].sort()).toEqual(['appmap-archive-full_foobar.tar']);
  });
});
