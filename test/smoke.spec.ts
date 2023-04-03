import {randomUUID} from 'crypto';
import Archiver, {ArtifactStore} from '../src/Archiver';
import {archive} from '../src/index';
import {executeCommand} from '../src/executeCommand';
import {cp, readFile, rm} from 'fs/promises';
import {join} from 'path';

const pwd = process.cwd();
const fixtureDir = join(__dirname, 'fixture');
const workDir = join(__dirname, 'work');

class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string>();

  async uploadArtifact(name: string, path: string): Promise<void> {
    this.artifacts.set(name, path);
  }
}

describe('archive-appmap-action', () => {
  beforeEach(async () => cp(fixtureDir, workDir, {recursive: true, force: true}));
  beforeEach(() => process.chdir(workDir));
  afterEach(() => process.chdir(pwd));
  afterEach(async () => rm(workDir, {recursive: true, force: true}));

  it('build and store an AppMap archive', async () => {
    const artifactStore = new MockArtifactStore();
    const archiveBranch = randomUUID();
    const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD');
    await executeCommand(`git checkout -b ${archiveBranch}`);
    await executeCommand(`git checkout ${currentBranch}`);

    const performTest = async () => {
      const archiver = new Archiver(artifactStore);
      archiver.toolsPath = './archive';
      archiver.archiveBranch = archiveBranch;
      archiver.commit = true;
      archiver.push = false;
      await archive(archiver);
    };

    const cleanupBranch = async () => {
      await executeCommand(`git checkout ${currentBranch}`);
      await executeCommand(`git branch -D ${archiveBranch}`);
    };

    try {
      await performTest();
    } finally {
      await cleanupBranch();
    }

    expect([...artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_402dec8.json',
      'appmap-archive-full_402dec8.tar.gz',
    ]);
    expect(artifactStore.artifacts.get('appmap-archive-full_402dec8.json')).toBe(
      '.appmap/archive/full/appmap_archive.json'
    );
    expect(artifactStore.artifacts.get('appmap-archive-full_402dec8.tar.gz')).toBe(
      '.appmap/archive/full/appmaps.tar.gz'
    );
    const metadata = JSON.parse(
      await readFile(artifactStore.artifacts.get('appmap-archive-full_402dec8.json')!, 'utf8')
    );
    expect(metadata.github_artifact_name).toEqual('appmap-archive-full_402dec8.tar.gz');
  });
});
