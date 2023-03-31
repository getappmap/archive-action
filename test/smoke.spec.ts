import {randomUUID} from 'crypto';
import {join} from 'path';
import Archiver, {ArtifactStore} from '../src/Archiver';
import {archive} from '../src/index';
import {executeCommand} from '../src/executeCommand';

const pwd = process.cwd();

class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string>();

  async uploadArtifact(name: string, path: string): Promise<void> {
    this.artifacts.set(name, path);
  }
}

describe('archive-appmap-action', () => {
  beforeEach(() => process.chdir(join(__dirname, 'fixture')));
  afterEach(() => process.chdir(pwd));

  it('build and store an AppMap archive', async () => {
    const artifactStore = new MockArtifactStore();
    const archiveBranch = randomUUID();
    const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD');
    const currentEmail = (await executeCommand(`git config user.email`)).trim();
    const currentName = (await executeCommand(`git config user.name`)).trim();
    await executeCommand(`git checkout -b ${archiveBranch}`);
    await executeCommand(`git checkout ${currentBranch}`);

    const performTest = async () => {
      const archiver = new Archiver(artifactStore);
      archiver.toolsPath = './archive';
      archiver.archiveBranch = archiveBranch;
      archiver.push = false;
      const archiveResult = await archive(archiver);

      expect(archiveResult.branchStatus.find(status => status.endsWith('.tar'))).toEqual(
        `?? .appmap/archive.tar`
      );
    };

    const cleanupBranch = async () => {
      await executeCommand(`git config user.email ${currentEmail}`);
      await executeCommand(`git config user.name "${currentName}"`);
      await executeCommand(`git checkout ${currentBranch}`);
      await executeCommand(`git branch -D ${archiveBranch}`);
    };

    try {
      await performTest();
    } finally {
      await cleanupBranch();
    }

    expect([...artifactStore.artifacts.keys()]).toEqual(['archive']);
    expect(artifactStore.artifacts.get('archive')).toBe('.appmap/archive.tar');
  });
});
