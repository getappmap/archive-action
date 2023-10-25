import * as core from '@actions/core';
import {ArgumentParser} from 'argparse';
import {
  ActionLogger,
  DirectoryArtifactStore,
  log,
  LogLevel,
  setLogger,
  uploadArtifact,
  verbose,
} from '@appland/action-utils';
import assert from 'assert';

import ArchiveAction from './ArchiveAction';
import locateArchiveFile from './locateArchiveFile';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './AppMapCommand';
import CLIAppMapCommand from './CLIAppMapCommand';
import LocalCacheStore from './LocalCacheStore';

export class Archive extends ArchiveAction {
  public archiveId?: string | number;
  public threadCount?: number;

  async archive(): Promise<ArchiveResults> {
    log(LogLevel.Debug, `revision: ${this.revision}`);
    log(LogLevel.Debug, `jobRunId: ${this.jobRunId}`);
    log(LogLevel.Debug, `jobAttemptId: ${this.jobAttemptId}`);
    log(LogLevel.Debug, `archiveId: ${this.archiveId}`);

    const archiveOptions: ArchiveOptions = {};
    const revision = this.archiveId ? this.archiveId.toString() : this.revision;
    if (revision) archiveOptions.revision = revision;
    if (this.threadCount) archiveOptions.threadCount = this.threadCount;

    log(LogLevel.Info, `Archiving AppMaps with options ${JSON.stringify(archiveOptions)}}`);
    await this.appMapCommand.archive(archiveOptions);
    const archiveFile = await locateArchiveFile('.');

    // Do not report configuration on a worker node of a matrix build. Configuration report will be performed by the merge action.
    if (!this.archiveId) {
      log(LogLevel.Info, 'Optionally sending configuration report');
      if (await this.configurationReporter.shouldReportConfiguration(this.revision)) {
        assert(this.revision);
        await this.configurationReporter.report(
          this.revision,
          this.appMapCommand,
          this.artifactStore,
          this.githubToken
        );
      }
    } else {
      log(LogLevel.Info, 'Skipping configuration report because archive-id is defined');
    }

    // On a worker node of a matrix build, save the archive to the build cache.
    // Otherwise, save it as an artifact.
    log(LogLevel.Info, 'Saving archive');
    if (this.archiveId) {
      assert(this.jobRunId, 'run number (GITHUB_RUN_ID) is not set');
      assert(this.jobAttemptId, 'attempt number (GITHUB_RUN_ATTEMPT) is not set');
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, this.archiveId);
      log(LogLevel.Info, `Caching archive ${archiveFile} as ${key}`);
      await this.cacheStore.save([archiveFile], key);
    } else {
      log(LogLevel.Info, `Uploading archive ${archiveFile}`);
      await uploadArtifact(this.artifactStore, archiveFile);
    }

    return {archiveFile};
  }
}

export async function runInGitHub(action: Archive) {
  verbose(core.getInput('verbose'));
  setLogger(new ActionLogger());

  const archiveId = core.getInput('archive-id');
  const revision = core.getInput('revision');

  ArchiveAction.applyGitHubActionInputs(action);

  if (archiveId) {
    if (revision)
      log(LogLevel.Warn, `Ignoring revision option '${revision}' because archive-id is set`);

    action.archiveId = archiveId;
  } else {
    action.revision = revision || process.env.GITHUB_SHA;
  }

  await action.archive();
}

async function runLocally(action: Archive) {
  const parser = new ArgumentParser({
    description: 'Create and store an AppMap archive',
  });
  parser.add_argument('-v', '--verbose');
  parser.add_argument('-d', '--directory', {help: 'Program working directory'});
  parser.add_argument('--artifact-dir', {default: '.appmap/artifacts'});
  parser.add_argument('--appmap-command', {default: 'appmap'});
  parser.add_argument('-r', '--revision', {help: 'Git revision'});
  parser.add_argument('-a', '--archive-id', {
    help: 'Archive id, used in place of Git revision for matrix jobs',
  });
  parser.add_argument('--thread-count', {type: Number});

  const options = parser.parse_args();
  const {
    directory,
    revision,
    artifact_dir: artifactDir,
    appmap_command: appmapCommand,
    archive_id: archiveId,
    thread_count: threadCount,
  } = options;
  verbose(options.verbose);

  if (directory) process.chdir(directory);

  if (appmapCommand) {
    const appMapCommand = new CLIAppMapCommand();
    appMapCommand.toolsCommand = appmapCommand;
    action.appMapCommand = appMapCommand;
  }
  action.artifactStore = new DirectoryArtifactStore(artifactDir);
  action.cacheStore = new LocalCacheStore();
  if (revision) action.revision = revision;
  if (archiveId) action.archiveId = archiveId;
  if (threadCount) action.threadCount = parseInt(threadCount.toString(), 10);

  await action.archive();
}

if (require.main === module) {
  const action = new Archive();
  if (process.env.CI) runInGitHub(action);
  else runLocally(action);
}
