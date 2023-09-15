import * as core from '@actions/core';
import {ArgumentParser} from 'argparse';
import {log, LogLevel, verbose} from '@appland/action-utils';
import assert from 'assert';

import ArchiveAction from './ArchiveAction';
import locateArchiveFile from './locateArchiveFile';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions} from './ArchiveCommand';
import CLIArchiveCommand from './CLIArchiveCommand';
import LocalArtifactStore from './LocalArtifactStore';
import LocalCacheStore from './LocalCacheStore';

export class Archive extends ArchiveAction {
  public archiveId?: string | number;
  public threadCount?: number;

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
    if (this.threadCount) archiveOptions.threadCount = this.threadCount;

    log(LogLevel.Info, `Archiving AppMaps with options ${JSON.stringify(archiveOptions)}}`);

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

async function runInGitHub() {
  const archiveId = core.getInput('archive-id');
  const isVerbose = core.getInput('verbose');
  verbose(isVerbose);

  const action = new Archive();
  ArchiveAction.prepareAction(action);
  if (archiveId) action.archiveId = archiveId;

  await action.archive();
}

async function runLocally() {
  const parser = new ArgumentParser({
    description: 'Create and store an AppMap archive',
  });
  parser.add_argument('-v', '--verbose');
  parser.add_argument('-d', '--directory', {help: 'Program working directory'});
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
    appmap_command: appmapCommand,
    archive_id: archiveId,
    thread_count: threadCount,
  } = options;
  verbose(options.verbose);

  if (directory) process.chdir(directory);

  const action = new Archive();
  if (appmapCommand) {
    const archiveCommand = new CLIArchiveCommand();
    archiveCommand.toolsCommand = appmapCommand;
    action.archiveCommand = archiveCommand;
  }
  action.artifactStore = new LocalArtifactStore();
  action.cacheStore = new LocalCacheStore();
  if (revision) action.revision = revision;
  if (archiveId) action.archiveId = archiveId;
  if (threadCount) action.threadCount = parseInt(threadCount.toString(), 10);

  await action.archive();
}

if (require.main === module) {
  if (process.env.CI) runInGitHub();
  else runLocally();
}
