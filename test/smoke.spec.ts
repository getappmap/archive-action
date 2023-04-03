import {randomUUID} from 'crypto';
import Archiver, {ArtifactStore} from '../src/Archiver';
import {executeCommand} from '../src/executeCommand';
import {cp, readFile, rm} from 'fs/promises';
import {join} from 'path';
import verbose from '../src/verbose';

const pwd = process.cwd();
const fixtureDir = join(__dirname, 'fixture');
const workDir = join(__dirname, 'work');

if (process.env.VERBOSE) verbose(true);

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
    currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD');

    await executeCommand(`git checkout -b ${archiveBranch}`);
    await executeCommand(`git checkout ${currentBranch}`);
  };

  const cleanupBranch = async () => {
    await executeCommand(`git checkout ${currentBranch}`);
    await executeCommand(`git branch -D ${archiveBranch}`);
  };

  beforeEach(() => (artifactStore = new MockArtifactStore()));
  beforeEach(async () => cp(fixtureDir, workDir, {recursive: true, force: true}));
  beforeEach(() => process.chdir(workDir));
  beforeEach(checkoutBranch);
  afterEach(cleanupBranch);
  afterEach(() => process.chdir(pwd));
  afterEach(async () => rm(workDir, {recursive: true, force: true}));

  it('build and store an AppMap archive', async () => {
    const archiver = new Archiver(artifactStore);
    archiver.toolsPath = './archive';
    archiver.archiveBranch = archiveBranch;
    archiver.revision = false; // Disable revision auto-detection
    archiver.commit = true;
    archiver.push = false;
    await archiver.archive();

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

  it('assign the archive to an arbitrary revision', async () => {
    const archiver = new Archiver(artifactStore);
    archiver.toolsPath = './archive';
    archiver.archiveBranch = archiveBranch;
    archiver.revision = 'foobar';
    await archiver.archive();

    expect([...artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_foobar.json',
      'appmap-archive-full_foobar.tar.gz',
    ]);
  });
});
