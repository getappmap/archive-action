import assert from 'assert';
import {Archive} from '../src/archive';
import * as locateArchiveFile from '../src/locateArchiveFile';
import * as test from './helper';
import CLIArchiveCommand from '../src/CLIArchiveCommand';
import * as executeCommand from '../src/executeCommand';

describe('archive', () => {
  let context: test.ArchiveTestContext;
  let action: Archive;

  beforeEach(async () => {
    context = new test.ArchiveTestContext();
    await context.setup();
    action = new Archive();
    action.artifactStore = context.artifactStore;
    action.cacheStore = context.noCacheStore;
    action.archiveCommand = context.archiveCommand;
    action.jobAttemptId = 1;
    action.jobRunId = 1;
  });

  afterEach(async () => {
    assert(context);
    await context.teardown();
  });

  it('build and store an AppMap archive', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/402dec8.tar');

    await action.archive();

    expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_402dec8.tar',
    ]);
    expect(context.artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
      '.appmap/archive/full/402dec8.tar'
    );
    console.log(context.archiveCommand.commands);
  });

  it('assign the archive to an arbitrary revision', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/foobar.tar');

    action.revision = 'foobar';
    await action.archive();

    expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_foobar.tar',
    ]);
  });

  it('has a thread count parameter', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/foobar.tar');

    action.archiveCommand = new CLIArchiveCommand();
    jest.spyOn(executeCommand, 'executeCommand').mockResolvedValue('');

    action.threadCount = 1;
    await action.archive();

    expect(executeCommand.executeCommand).toHaveBeenCalledTimes(1);
    expect(executeCommand.executeCommand).toHaveBeenCalledWith(
      'appmap archive --thread-count 1',
      false,
      true,
      true
    );
  });

  describe('in matrix mode', () => {
    it('stores the archive to the build cache', async () => {
      const archiveId = 1;
      jest
        .spyOn(locateArchiveFile, 'default')
        .mockResolvedValue(`.appmap/archive/full/${archiveId}.tar`);

      context.noCacheStore.save = jest.fn();

      action.archiveId = archiveId;
      await action.archive();

      expect([...context.artifactStore.artifacts.keys()]).toEqual([]);
      expect(context.noCacheStore.save).toHaveBeenCalledTimes(1);
      expect(context.noCacheStore.save).toHaveBeenCalledWith(
        [`.appmap/archive/full/${archiveId}.tar`],
        'appmap-archive-run_1-attempt_1-worker_1'
      );
    });
  });
});
