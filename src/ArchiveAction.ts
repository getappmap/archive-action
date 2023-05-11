import * as core from '@actions/core';
import {basename, dirname} from 'path';
import log, {LogLevel} from './log';
import ArtifactStore from './ArtifactStore';
import CacheStore from './CacheStore';
import ArchiveCommand from './ArchiveCommand';
import GitHubArtifactStore from './GitHubArtifactStore';
import GitHubCacheStore from './GitHubCacheStore';
import CLIArchiveCommand from './CLIArchiveCommand';
import verbose from './verbose';

export default abstract class ArchiveAction {
  public jobRunId: string | number | undefined = process.env.GITHUB_RUN_ID;
  public jobAttemptId: string | number | undefined = process.env.GITHUB_RUN_ATTEMPT;

  public artifactStore: ArtifactStore = new GitHubArtifactStore();
  public cacheStore: CacheStore = new GitHubCacheStore();
  public archiveCommand: ArchiveCommand = new CLIArchiveCommand();
  public revision?: string;

  static cacheKey(
    jobRunId: string | number,
    jobAttemptId: string | number,
    workerId: string | number
  ): string {
    return [
      'appmap-archive',
      `run_${jobRunId}`,
      `attempt_${jobAttemptId}`,
      `worker_${workerId}`,
    ].join('-');
  }

  static prepareAction(action: ArchiveAction) {
    verbose(core.getBooleanInput('verbose'));

    const directory = core.getInput('directory');
    // commit-sha is checked for backwards compatibility
    const revision =
      core.getInput('revision') || core.getInput('commit-sha') || process.env.GITHUB_SHA;
    if (directory) {
      log(LogLevel.Info, `Changing to working directory ${directory}`);
      process.chdir(directory);
    }

    if (revision) action.revision = revision;
    if (process.env.ACT === 'true') {
      log(LogLevel.Info, `Running in ACT mode. Setting runId = 1, attemptId = 1`);
      action.jobRunId = 1;
      action.jobAttemptId = 1;
    }
  }

  protected async uploadArtifact(archiveFile: string): Promise<{archiveFile: string}> {
    log(LogLevel.Debug, `Processing AppMap archive ${archiveFile}`);

    // e.g. .appmap/archive/full
    const dir = dirname(archiveFile);
    // e.g. appmap-archive-full
    const artifactPrefix = dir.replace(/\//g, '-').replace(/\./g, '');
    const [sha] = basename(archiveFile).split('.');
    const artifactName = `${artifactPrefix}_${sha}.tar`;

    await this.artifactStore.uploadArtifact(artifactName, archiveFile);

    return {archiveFile};
  }
}
