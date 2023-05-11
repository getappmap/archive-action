import * as core from '@actions/core';
import assert from 'assert';
import {mkdir, readFile, rm} from 'fs/promises';
import {executeCommand} from './executeCommand';
import locateArchiveFile from './locateArchiveFile';
import ArchiveAction from './ArchiveAction';
import {glob} from 'glob';
import log, {LogLevel} from './log';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './ArchiveCommand';
import verbose from './verbose';

export class Merge extends ArchiveAction {
  constructor(public matrixCount: number) {
    super();
  }

  async merge(): Promise<ArchiveResults> {
    log(LogLevel.Debug, `jobRunId: ${this.jobRunId}`);
    log(LogLevel.Debug, `jobAttemptId: ${this.jobAttemptId}`);

    const archiveOptions: ArchiveOptions = {revision: this.revision};

    assert(this.jobRunId, 'run number (GITHUB_RUN_ID) is not set');
    assert(this.jobAttemptId, 'attempt number (GITHUB_RUN_ATTEMPT) is not set');

    const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId);

    const paths = Array.from({length: this.matrixCount}, (_, i) => i).map(
      i => `.appmap/archive/full/appmap_archive_${i}.tar`
    );
    await this.cacheStore.restore(paths, key);

    const archiveFiles = await glob('.appmap/archive/full/*.tar', {dot: true});

    if (archiveFiles.length === this.matrixCount) {
      throw new Error(
        `Expecting to find ${this.matrixCount} archive files, but found ${archiveFiles.length}`
      );
    }

    let appmapDir: string | undefined;
    await mkdir('tmp/appmap', {recursive: true});
    for (const archiveFile of archiveFiles) {
      await executeCommand(`tar -xf ${archiveFile} -C tmp/appmap`);

      if (!appmapDir) {
        const archiveMetadata = JSON.parse(await readFile('tmp/appmap_archive.json', 'utf-8'));
        appmapDir = (archiveMetadata.config.appmapDir || 'tmp/appmap') as string;
        await mkdir(appmapDir, {recursive: true});
      }

      await executeCommand(`tar -xf tmp/appmap/appmaps.tar.gz -C ${appmapDir}`);
      await rm('tmp/appmap/appmap_archive.json');
      await rm('tmp/appmap/appmaps.tar.gz');
    }
    archiveOptions.index = false;

    await this.archiveCommand.archive(archiveOptions);

    const archiveFile = await locateArchiveFile('.');

    return await this.uploadArtifact(archiveFile);
  }
}

if (require.main === module) {
  const workerCount = core.getInput('worker-count');
  assert(workerCount, 'worker-count is not set');

  const action = new Merge(parseInt(workerCount, 100));
  ArchiveAction.prepareAction(action);

  action.merge();
}
