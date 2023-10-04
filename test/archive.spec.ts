import assert from 'assert';
import * as actionUtils from '@appland/action-utils';
import {executeCommand} from '@appland/action-utils';

import {Archive} from '../src/archive';
import * as locateArchiveFile from '../src/locateArchiveFile';
import * as test from './helper';
import CLIArchiveCommand from '../src/CLIArchiveCommand';

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

  it('build and store AppMap archive and inventory', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/402dec8.tar');

    action.archiveCommand = new CLIArchiveCommand();
    jest.spyOn(actionUtils, 'executeCommand').mockResolvedValue('');

    await action.archive();

    expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_402dec8.tar',
      'appmap-inventory_HEAD.tar',
    ]);
    expect(context.artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
      '.appmap/archive/full/402dec8.tar'
    );

    expect(executeCommand).toHaveBeenCalledTimes(3);
    expect(executeCommand).toHaveBeenNthCalledWith(1, 'appmap archive', {
      printStdout: true,
      printStderr: true,
    });
    expect(executeCommand).toHaveBeenNthCalledWith(
      2,
      'appmap inventory .appmap/inventory/HEAD.json'
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      3,
      'appmap inventory-report --template-name welcome .appmap/inventory/HEAD.json .appmap/inventory/HEAD.md'
    );
  });

  it('assign the archive to an arbitrary revision', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/foobar.tar');

    action.revision = 'foobar';
    await action.archive();

    expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_foobar.tar',
      'appmap-inventory_foobar.tar',
    ]);
  });

  it('has a thread count parameter', async () => {
    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/foobar.tar');

    action.archiveCommand = new CLIArchiveCommand();
    jest.spyOn(actionUtils, 'executeCommand').mockResolvedValue('');

    action.threadCount = 1;
    await action.archive();

    expect(executeCommand).toHaveBeenCalledTimes(3);
    expect(executeCommand).toHaveBeenCalledWith('appmap archive --thread-count 1', {
      printStdout: true,
      printStderr: true,
    });
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

      expect([...context.artifactStore.artifacts.keys()]).toEqual(['appmap-inventory_1.tar']);
      expect(context.noCacheStore.save).toHaveBeenCalledTimes(1);
      expect(context.noCacheStore.save).toHaveBeenCalledWith(
        [`.appmap/archive/full/${archiveId}.tar`],
        'appmap-archive-run_1-attempt_1-worker_1'
      );
    });
  });
});
