import * as core from '@actions/core';
import assert from 'assert';
import {cp, mkdir, readFile, stat} from 'fs/promises';
import locateArchiveFile from './locateArchiveFile';
import ArchiveAction from './ArchiveAction';
import log, {LogLevel} from './log';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions, RestoreOptions} from './ArchiveCommand';
import {glob} from 'glob';
import {basename, join} from 'path';
import {existsSync} from 'fs';

export class Merge extends ArchiveAction {
  constructor(public archiveCount: number) {
    super();
  }

  async merge(): Promise<ArchiveResults> {
    log(LogLevel.Debug, `revision: ${this.revision}`);
    log(LogLevel.Debug, `jobRunId: ${this.jobRunId}`);
    log(LogLevel.Debug, `jobAttemptId: ${this.jobAttemptId}`);
    log(LogLevel.Debug, `archiveCount: ${this.archiveCount}`);

    assert(this.jobRunId, 'run number (GITHUB_RUN_ID) is not set');
    assert(this.jobAttemptId, 'attempt number (GITHUB_RUN_ATTEMPT) is not set');
    assert(this.archiveCount > 0, 'archive count must be greater than zero');

    for (const worker of Array.from({length: this.archiveCount}, (_, i) => i)) {
      const archiveFile = `.appmap/archive/full/${worker}.tar`;
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, worker);
      log(LogLevel.Info, `Restoring AppMap archive ${archiveFile} using cache key ${key}`);
      await this.cacheStore.restore([archiveFile], key);
      assert(
        existsSync(archiveFile),
        `Archive file ${archiveFile} was not restored from the cache`
      );
      await this.unpackArchive(worker.toString());
    }

    const workDirs = await glob('.appmap/work/*');
    assert(
      workDirs.length === this.archiveCount,
      `Expected ${this.archiveCount} work directories, found ${workDirs.length}`
    );
    let appmapDir: string;
    {
      const workDir = workDirs[0];
      assert(workDir);
      const archiveMetadata = JSON.parse(
        await readFile(join(workDir, 'appmap_archive.json'), 'utf-8')
      );
      const configAppMapDir = archiveMetadata.config.appmap_dir;
      if (configAppMapDir) {
        appmapDir = configAppMapDir;
      } else {
        log(
          LogLevel.Warn,
          `config.appmap_dir not found in archive metadata, using default value tmp/appmap`
        );
        appmapDir = 'tmp/appmap';
      }
    }

    await mkdir(appmapDir, {recursive: true});
    for (const workDir of workDirs) {
      const directoryContents = await glob(join(workDir, '*'), {dot: true});
      for (const file of directoryContents) {
        if (file.includes('/appmap_archive.') && file.endsWith('.json')) continue;

        await cp(file, join(appmapDir, basename(file)), {recursive: true});
      }
    }

    // TODO: Each archive directory already contains an openapi.yml file, so it would be
    // quite possible, and much more efficient, to merge those files instead of generating
    // a new one from scratch.
    log(LogLevel.Info, 'Generating OpenAPI definitions');
    await this.archiveCommand.generateOpenAPI(appmapDir);

    log(LogLevel.Info, 'Building merged archive');
    const archiveOptions: ArchiveOptions = {index: false};
    if (this.revision) archiveOptions.revision = this.revision;
    await this.archiveCommand.archive(archiveOptions);

    const archiveFile = await locateArchiveFile('.');

    return await this.uploadArtifact(archiveFile);
  }

  async unpackArchive(archiveId: string) {
    const options: RestoreOptions = {revision: archiveId, exact: true};
    await this.archiveCommand.restore(options);

    const workDir = join('.appmap/work', archiveId);
    const workDirStats = await stat(workDir);
    assert(workDirStats.isDirectory(), `${workDir} does not exist`);
  }
}

if (require.main === module) {
  const archiveCount = core.getInput('archive-count');
  assert(archiveCount, 'archive-count is not set');

  const action = new Merge(parseInt(archiveCount, 10));
  ArchiveAction.prepareAction(action);

  action.merge();
}
