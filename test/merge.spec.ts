import assert from 'assert';
import {join} from 'path';
import {cp, mkdir, writeFile} from 'fs/promises';
import {rm} from 'fs/promises';
import {Merge} from '../src/merge';
import * as test from './helper';
import * as locateArchiveFile from '../src/locateArchiveFile';

describe('merge', () => {
  let context: test.ArchiveTestContext;
  let archiveCount = 2;
  let action: Merge;

  beforeEach(async () => {
    context = new test.ArchiveTestContext();
    await context.setup();
    action = new Merge(archiveCount);
    action.artifactStore = context.artifactStore;
    action.cacheStore = context.noCacheStore;
    action.archiveCommand = context.archiveCommand;
    action.jobAttemptId = 1;
    action.jobRunId = 1;

    await rm(join(context.workDir, 'tmp/appmap'), {recursive: true});
    await mkdir(join(context.workDir, 'tmp/appmap'), {recursive: true});
  });

  afterEach(() => {
    assert(context);
    context.teardown();
  });

  it('fetches archives from the cache and merges them', async () => {
    const placeTarFile = async (revision: string) => {
      await mkdir(join(context.workDir, '.appmap/work', revision.toString()), {recursive: true});
      await cp(
        join(test.FixtureDir, 'tmp/appmap'),
        join(context.workDir, '.appmap/work', revision.toString()),
        {
          recursive: true,
        }
      );
      await writeFile(
        join(context.workDir, '.appmap/work', revision.toString(), 'appmap_archive.json'),
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

    jest.spyOn(locateArchiveFile, 'default').mockResolvedValue('.appmap/archive/full/402dec8.tar');

    await action.merge();

    expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
      'appmap-archive-full_402dec8.tar',
    ]);
    expect(context.artifactStore.artifacts.get('appmap-archive-full_402dec8.tar')).toBe(
      '.appmap/archive/full/402dec8.tar'
    );

    expect(context.archiveCommand.commands).toEqual([
      {command: 'restore', options: {revision: '0', exact: true}},
      {command: 'restore', options: {revision: '1', exact: true}},
      {
        command: 'archive',
        options: {index: false},
      },
    ]);
  });
});
