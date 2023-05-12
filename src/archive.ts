import * as core from '@actions/core';
import assert from 'assert';
import ArchiveAction from './ArchiveAction';
import locateArchiveFile from './locateArchiveFile';
import log, {LogLevel} from './log';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './ArchiveCommand';

export class Archive extends ArchiveAction {
  public archiveId?: string | number;

  async archive(): Promise<ArchiveResults> {
    log(LogLevel.Debug, `revision: ${this.revision}`);
    log(LogLevel.Debug, `jobRunId: ${this.jobRunId}`);
    log(LogLevel.Debug, `jobAttemptId: ${this.jobAttemptId}`);
    log(LogLevel.Debug, `archiveId: ${this.archiveId}`);

    if (this.archiveId && this.revision) {
      log(LogLevel.Warn, `Ignoring revision option ${this.revision} because archiveId is set`);
      this.revision = undefined;
    }

    const archiveOptions: ArchiveOptions = {};
    const revision = this.archiveId ? this.archiveId.toString() : this.revision;
    if (revision) archiveOptions.revision = revision;
    await this.archiveCommand.archive(archiveOptions);
    const archiveFile = await locateArchiveFile('.');

    if (this.archiveId) {
      assert(this.jobRunId, 'run number (GITHUB_RUN_ID) is not set');
      assert(this.jobAttemptId, 'attempt number (GITHUB_RUN_ATTEMPT) is not set');
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, this.archiveId);
      log(LogLevel.Info, `Caching AppMap archive ${archiveFile} as ${key}`);
      await this.cacheStore.save([archiveFile], key);
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

  const archiveId = core.getInput('archive-id');
  if (archiveId) action.archiveId = archiveId;

  action.archive();
}
