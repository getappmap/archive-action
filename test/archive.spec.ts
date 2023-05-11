import {randomUUID} from 'crypto';
import ArtifactStore from '../src/ArtifactStore';
import {Archive} from '../src/archive';
import {executeCommand} from '../src/executeCommand';
import * as locateArchiveFile from '../src/locateArchiveFile';
import * as test from './helper';
import {cp, rm} from 'fs/promises';
import CacheStore from '../src/CacheStore';
import ArchiveCommand, {ArchiveOptions} from '../src/ArchiveCommand';

class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string>();

  async uploadArtifact(name: string, path: string): Promise<void> {
    this.artifacts.set(name, path);
  }
}

class NoCacheStore implements CacheStore {
  save(paths: string[], key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  restore(paths: string[], key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

class MockArchiveCommand implements ArchiveCommand {
  public commands: ArchiveOptions[] = [];

  async archive(options?: ArchiveOptions | undefined): Promise<void> {
    this.commands.push(options || {});
  }
}

describe('archive-appmap-action', () => {
  let artifactStore: MockArtifactStore;
  let noCacheStore: NoCacheStore;
  let archiveCommand: MockArchiveCommand;
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
  let action: Archive;

  beforeEach(() => (artifactStore = new MockArtifactStore()));
  beforeEach(() => (noCacheStore = new NoCacheStore()));
  beforeEach(() => (workDir = test.makeWorkDir()));
  beforeEach(() => (archiveCommand = new MockArchiveCommand()));
  beforeEach(() => cp(test.fixtureDir, workDir, {recursive: true, force: true}));
  beforeEach(() => process.chdir(workDir));
  beforeEach(() => {
    noCacheStore.save = jest.fn();
    noCacheStore.restore = jest.fn();

    action = new Archive();
    action.artifactStore = artifactStore;
    action.cacheStore = noCacheStore;
    action.archiveCommand = archiveCommand;
    action.jobAttemptId = 1;
    action.jobRunId = 1;
  });
  beforeEach(checkoutBranch);

  afterEach(cleanupBranch);
  afterEach(() => process.chdir(test.pwd));
  afterEach(() => rm(workDir, {recursive: true, force: true}));
  afterEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());
  afterEach(() => jest.resetAllMocks());

  it('build and store an AppMap archive', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/402dec8.tar');

    await action.archive();

    expect([...artifactStore.artifacts.keys()].sort()).toEqual(['appmap-archive-full_402dec8.tar']);
    expect(artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
      '.appmap/archive/full/402dec8.tar'
    );
    console.log(archiveCommand.commands);
  });

  it('assign the archive to an arbitrary revision', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/foobar.tar');

    action.revision = 'foobar';
    await action.archive();

    expect([...artifactStore.artifacts.keys()].sort()).toEqual(['appmap-archive-full_foobar.tar']);
  });

  describe('in matrix mode', () => {
    it('stores the archive to the build cache', async () => {
      jest
        .spyOn(locateArchiveFile, 'default')
        .mockResolvedValue('.appmap/archive/full/402dec8.tar');

      action.workerId = 1;
      await action.archive();

      expect([...artifactStore.artifacts.keys()]).toEqual([]);
      expect(noCacheStore.save).toHaveBeenCalledTimes(1);
      expect(noCacheStore.save).toHaveBeenCalledWith(
        ['.appmap/archive/full/402dec8.tar'],
        'appmap-archive-run_1-attempt_1-worker_1'
      );
    });
  });
});
