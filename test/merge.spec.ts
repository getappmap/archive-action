import assert from 'assert';
import {join} from 'path';
import {mkdir, writeFile} from 'fs/promises';
import {rm} from 'fs/promises';
import {executeCommand} from '@appland/action-utils';
import * as actionUtils from '@appland/action-utils';

import {Merge} from '../src/merge';
import * as test from './helper';
import * as locateArchiveFile from '../src/locateArchiveFile';
import {RestoreOptions} from '../src/AppMapCommand';

describe('merge', () => {
  let logMessages: Record<string, string[]> = {};
  let context: test.ArchiveTestContext;
  let archiveCount = 2;
  let action: Merge;

  beforeEach(async () => {
    context = new test.ArchiveTestContext();
    await context.setup();
    action = new Merge(archiveCount);
    action.revision = '402dec8';
    action.artifactStore = context.artifactStore;
    action.cacheStore = context.noCacheStore;
    action.appMapCommand = context.appMapCommand;
    action.configurationReporter = context.configurationReporter;
    action.jobAttemptId = 1;
    action.jobRunId = 1;
    action.githubToken = 'fake-token';

    await rm(join('tmp/appmap'), {recursive: true});
    await mkdir(join('tmp/appmap'), {recursive: true});
  });

  afterEach(async () => {
    assert(context);
    await context.teardown();
  });
  afterEach(() => jest.restoreAllMocks());

  describe('with revision', () => {
    beforeEach(() => (action.revision = '402dec8'));

    describe('with github token', () => {
      beforeEach(() => (action.githubToken = 'the-github-token'));

      it('fetches archives from the cache and merges them', async () => {
        jest.spyOn(actionUtils.Commenter, 'commentTagPattern');

        jest
          .spyOn(actionUtils, 'log')
          .mockImplementation((logLevel: actionUtils.LogLevel, message: string) => {
            logMessages ||= {};
            logMessages[logLevel] ||= [];
            logMessages[logLevel].push(message);
          });

        const placeTarFile = async (revision: string) => {
          await mkdir(join('.appmap/archive/full'), {recursive: true});
          await writeFile(join('.appmap/archive/full', `${revision}.tar`), '# dummy file');
        };

        const unpackTarFile = async (revision: string) => {
          await mkdir(join('.appmap/work', revision), {
            recursive: true,
          });
          await executeCommand(
            `cp -r ${join(test.FixtureDir, 'tmp/appmap')} ${join('.appmap/work', revision)}`
          );
          await writeFile(
            join('.appmap/work', revision.toString(), 'appmap_archive.json'),
            JSON.stringify(
              {
                config: {
                  appmap_dir: 'tmp/appmap',
                },
              },
              null,
              2
            )
          );
        };

        context.noCacheStore.restore = jest
          .fn()
          .mockImplementation(async (paths: string[], key: string) => {
            expect(paths.length).toEqual(1);
            const path = paths[0];
            expect(path).toMatch(/\.appmap\/archive\/full\/[01]\.tar/);
            const workerId = key.match(/worker_(\d+)$/)![1]!;
            await placeTarFile(workerId);
          });

        context.appMapCommand.restore = jest
          .fn()
          .mockImplementation(async (options: RestoreOptions) => {
            expect(options.exact).toEqual(true);
            const workerId = options.revision;
            assert(workerId !== undefined);
            expect(['0', '1']).toContain(workerId);
            await unpackTarFile(workerId);
          });

        jest
          .spyOn(locateArchiveFile, 'default')
          .mockResolvedValue('.appmap/archive/full/402dec8.tar');

        await action.merge();

        expect(context.appMapCommand.commands).toEqual([
          {
            command: 'archive',
            options: {analyze: false, revision: '402dec8'},
          },
        ]);

        expect(logMessages[actionUtils.LogLevel.Warn] || []).toEqual([]);

        expect(context.configurationReporter.reports).toEqual([
          {revision: '402dec8', githubToken: 'the-github-token'},
        ]);

        expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
          'appmap-archive-full_402dec8.tar',
        ]);
        expect(context.artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
          '.appmap/archive/full/402dec8.tar'
        );
      });
    });
  });
});
