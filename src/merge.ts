import * as core from '@actions/core';
import assert from 'assert';
import {mkdir, readFile, rm} from 'fs/promises';
import {executeCommand} from './executeCommand';
import locateArchiveFile from './locateArchiveFile';
import ArchiveAction from './ArchiveAction';
import log, {LogLevel} from './log';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './ArchiveCommand';
import {existsSync} from 'fs';
import {glob} from 'glob';

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

    for (const worker of Array.from({length: this.archiveCount}, (_, i) => i)) {
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, worker);
      log(LogLevel.Info, `Restoring AppMap archive ./appmap/archive using cache key ${key}`);
      await this.cacheStore.restore(['.appmap/archive'], key);

      const filePaths = await glob('.appmap/archive/**/*.tar');
      if (filePaths.length === 0) {
        throw new Error(`No AppMap archives found in .appmap/archive using cache key ${key}`);
      }
      if (filePaths.length !== 1) {
        log(LogLevel.Warn, `Expected exactly one AppMap archive, found ${filePaths.length}`);
      }

      for (const filePath of filePaths) {
        await this.unpackArchive(filePath);
      }
    }

    const archiveOptions: ArchiveOptions = {revision: this.revision, index: false};
    await this.archiveCommand.archive(archiveOptions);

    const archiveFile = await locateArchiveFile('.');

    return await this.uploadArtifact(archiveFile);
  }

  async unpackArchive(archiveFile: string) {
    let appmapDir: string | undefined;
    await mkdir('tmp/appmap', {recursive: true});

    await executeCommand(`tar -xf ${archiveFile} -C tmp/appmap`);

    if (!appmapDir) {
      const archiveMetadata = JSON.parse(await readFile('tmp/appmap/appmap_archive.json', 'utf-8'));
      appmapDir = (archiveMetadata.config.appmapDir || 'tmp/appmap') as string;
      await mkdir(appmapDir, {recursive: true});
    }

    await executeCommand(`tar -xzf tmp/appmap/appmaps.tar.gz -C ${appmapDir}`);
    await rm('tmp/appmap/appmap_archive.json');
    await rm('tmp/appmap/appmaps.tar.gz');
    await rm(archiveFile);
  }
}

if (require.main === module) {
  const archiveCount = core.getInput('archive-count');
  assert(archiveCount, 'archive-count is not set');

  const action = new Merge(parseInt(archiveCount, 10));
  ArchiveAction.prepareAction(action);

  action.merge();
}
