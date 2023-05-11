import assert from 'assert';
import {Archive} from '../src/archive';
import * as locateArchiveFile from '../src/locateArchiveFile';
import * as test from './helper';

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

  afterEach(() => {
    assert(context);
    context.teardown();
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

  describe('in matrix mode', () => {
    it('stores the archive to the build cache', async () => {
      jest
        .spyOn(locateArchiveFile, 'default')
        .mockResolvedValue('.appmap/archive/full/402dec8.tar');

      context.noCacheStore.rename = jest.fn();
      context.noCacheStore.save = jest.fn();

      action.workerId = 1;
      await action.archive();

      expect(context.noCacheStore.rename).toHaveBeenCalledTimes(1);
      expect(context.noCacheStore.rename).toHaveBeenCalledWith(
        '.appmap/archive/full/402dec8.tar',
        '.appmap/archive/full/1.tar'
      );
      expect([...context.artifactStore.artifacts.keys()]).toEqual([]);
      expect(context.noCacheStore.save).toHaveBeenCalledTimes(1);
      expect(context.noCacheStore.save).toHaveBeenCalledWith(
        ['.appmap/archive'],
        'appmap-archive-run_1-attempt_1-worker_1'
      );
    });
  });
});
