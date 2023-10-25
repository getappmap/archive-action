import * as core from '@actions/core';
import {log, LogLevel, ArtifactStore, GitHubArtifactStore} from '@appland/action-utils';

import CacheStore from './CacheStore';
import ArchiveCommand from './ArchiveCommand';
import GitHubCacheStore from './GitHubCacheStore';
import CLIArchiveCommand from './CLIArchiveCommand';
import GitHubConfigurationReporter from './GitHubConfigurationReporter';
import ConfigurationReporter from './ConfigurationReporter';

export default abstract class ArchiveAction {
  public jobRunId: string | number | undefined = process.env.GITHUB_RUN_ID;
  public jobAttemptId: string | number | undefined = process.env.GITHUB_RUN_ATTEMPT;

  public artifactStore: ArtifactStore = new GitHubArtifactStore();
  public cacheStore: CacheStore = new GitHubCacheStore();
  public archiveCommand: ArchiveCommand = new CLIArchiveCommand();
  public configurationReporter: ConfigurationReporter = new GitHubConfigurationReporter();

  public githubToken?: string;
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

  static applyGitHubActionInputs(action: ArchiveAction) {
    const directory = core.getInput('directory');
    if (directory) {
      log(LogLevel.Info, `Changing to working directory ${directory}`);
      process.chdir(directory);
    }

    action.githubToken = core.getInput('github-token');
  }
}
