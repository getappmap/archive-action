import * as core from '@actions/core';
import assert from 'assert';
import ArchiveAction from './ArchiveAction';
import locateArchiveFile from './locateArchiveFile';
import log, {LogLevel} from './log';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './ArchiveCommand';
import {dirname, join} from 'path';

export class Archive extends ArchiveAction {
  public workerId?: string | number;

  async archive(): Promise<ArchiveResults> {
    log(LogLevel.Debug, `revision: ${this.revision}`);
    log(LogLevel.Debug, `jobRunId: ${this.jobRunId}`);
    log(LogLevel.Debug, `jobAttemptId: ${this.jobAttemptId}`);
    log(LogLevel.Debug, `workerId: ${this.workerId}`);

    const archiveOptions: ArchiveOptions = {revision: this.revision};

    await this.archiveCommand.archive(archiveOptions);

    const archiveFile = await locateArchiveFile('.');

    if (this.workerId) {
      const cacheFileName = join(dirname(archiveFile), [this.workerId, 'tar'].join('.'));
      await this.cacheStore.rename(archiveFile, cacheFileName);
      assert(this.jobRunId, 'run number (GITHUB_RUN_ID) is not set');
      assert(this.jobAttemptId, 'attempt number (GITHUB_RUN_ATTEMPT) is not set');
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, this.workerId);
      log(LogLevel.Info, `Caching AppMap archive ${cacheFileName} as ${key}`);
      await this.cacheStore.save(['.appmap/archive'], key);
    } else {
      log(LogLevel.Info, `Uploading archive ${archiveFile}`);
      await this.uploadArtifact(archiveFile);
    }

    return {archiveFile};
  }
}

if (require.main === module) {
  const action = new Archive();
  ArchiveAction.prepareAction(action);

  const workerId = core.getInput('worker-id');
  if (workerId) action.workerId = workerId;

  action.archive();
}
