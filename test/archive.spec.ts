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
    action.configurationReporter = context.configurationReporter;
    action.jobAttemptId = 1;
    action.jobRunId = 1;
  });

  afterEach(async () => {
    assert(context);
    await context.teardown();
  });

  describe('with revision', () => {
    beforeEach(() => (action.revision = '402dec8'));

    describe('with github token', () => {
      beforeEach(() => (action.githubToken = 'the-github-token'));

      it('builds and stores AppMap archive and inventory', async () => {
        jest
          .spyOn(locateArchiveFile, 'default')
          .mockResolvedValue('.appmap/archive/full/402dec8.tar');

        action.archiveCommand = new CLIArchiveCommand();
        jest.spyOn(actionUtils, 'executeCommand').mockResolvedValue('');

        await action.archive();

        expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
          'appmap-archive-full_402dec8.tar',
        ]);
        expect(context.artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
          '.appmap/archive/full/402dec8.tar'
        );
        expect(context.configurationReporter.reports).toEqual([
          {revision: '402dec8', githubToken: 'the-github-token'},
        ]);

        expect(executeCommand).toHaveBeenCalledTimes(1);
        expect(executeCommand).toHaveBeenNthCalledWith(1, 'appmap archive --revision 402dec8', {
          printStdout: true,
          printStderr: true,
        });
      });

      it('assign the archive to an arbitrary revision', async () => {
        jest
          .spyOn(locateArchiveFile, 'default')
          .mockResolvedValue('.appmap/archive/full/foobar.tar');

        action.revision = 'foobar';
        await action.archive();

        // Does not store the inventory tar
        expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
          'appmap-archive-full_foobar.tar',
        ]);
      });

      it('has a thread count parameter', async () => {
        jest
          .spyOn(locateArchiveFile, 'default')
          .mockResolvedValue('.appmap/archive/full/foobar.tar');

        action.archiveCommand = new CLIArchiveCommand();

        const executeCommandSpy = jest.spyOn(actionUtils, 'executeCommand');
        executeCommandSpy.mockResolvedValue('');

        action.threadCount = 1;
        await action.archive();

        expect(executeCommandSpy).toHaveBeenCalledTimes(1);
        expect(executeCommandSpy).toHaveBeenCalledWith(
          'appmap archive --revision 402dec8 --thread-count 1',
          {
            printStdout: true,
            printStderr: true,
          }
        );
      });
    });

    describe('with archive-id', () => {
      it('stores the archive to the build cache', async () => {
        const archiveId = 1;
        action.archiveId = archiveId;

        jest
          .spyOn(locateArchiveFile, 'default')
          .mockResolvedValue(`.appmap/archive/full/${archiveId}.tar`);

        context.noCacheStore.save = jest.fn();

        await action.archive();

        // Does not report configuration
        expect(context.configurationReporter.reports).toEqual([]);

        // Does not store the inventory tar
        expect([...context.artifactStore.artifacts.keys()]).toEqual([]);

        // Does save the archive tar to the cache
        expect(context.noCacheStore.save).toHaveBeenCalledTimes(1);
        expect(context.noCacheStore.save).toHaveBeenCalledWith(
          [`.appmap/archive/full/${archiveId}.tar`],
          'appmap-archive-run_1-attempt_1-worker_1'
        );
      });
    });
  });
});
