import {randomUUID} from 'crypto';
import {join} from 'path';
import Archiver from '../src/Archiver';
import {archive} from '../src/index';
import {executeCommand} from '../src/executeCommand';

const pwd = process.cwd();

describe('archive-appmap-action', () => {
  beforeEach(() => process.chdir(join(__dirname, 'fixture')));
  afterEach(() => process.chdir(pwd));

  it('build and store an AppMap archive', async () => {
    const archiveBranch = randomUUID();
    const currentBranch = await executeCommand('git rev-parse --abbrev-ref HEAD');
    await executeCommand(`git checkout -b ${archiveBranch}`);
    await executeCommand(`git checkout ${currentBranch}`);

    const performTest = async () => {
      const archiver = new Archiver();
      archiver.toolsPath = './archive';
      archiver.archiveBranch = archiveBranch;
      archiver.push = false;
      const archiveResult = await archive(archiver);

      expect(archiveResult.branchStatus).toEqual([`?? .appmap/archive.txt`]);
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
  });
});
