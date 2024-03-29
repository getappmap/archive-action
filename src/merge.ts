import * as core from '@actions/core';
import assert from 'assert';
import {cp, mkdir, readFile, rm, stat} from 'fs/promises';
import {glob} from 'glob';
import {basename, join} from 'path';
import {existsSync} from 'fs';
import {ArgumentParser} from 'argparse';
import {
  ActionLogger,
  log,
  LogLevel,
  setLogger,
  verbose,
  DirectoryArtifactStore,
  uploadArtifact,
} from '@appland/action-utils';

import locateArchiveFile, {listArchiveFiles} from './locateArchiveFile';
import ArchiveAction from './ArchiveAction';
import ArchiveResults from './ArchiveResults';
import {ArchiveOptions, RestoreOptions} from './AppMapCommand';
import CLIAppMapCommand from './CLIAppMapCommand';
import LocalCacheStore from './LocalCacheStore';

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

    const workerIds = Array.from({length: this.archiveCount}, (_, i) => i);
    for (const worker of workerIds) {
      const archiveFile = `.appmap/archive/full/${worker}.tar`;
      const key = ArchiveAction.cacheKey(this.jobRunId, this.jobAttemptId, worker);
      log(LogLevel.Info, `Restoring AppMap archive ${archiveFile} using cache key ${key}`);
      await this.cacheStore.restore([archiveFile], key);
      assert(
        existsSync(archiveFile),
        `Archive file ${archiveFile} was not restored from the cache`
      );
      await this.unpackArchive(worker.toString());
      await rm(archiveFile);
    }

    const workDirs = (await glob('.appmap/work/*')).filter(dir => {
      const dirName = basename(dir);
      const workerId = parseInt(dirName, 10);
      // Are you excited to learn this? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseInt

      // If parseInt encounters a character that is not a numeral in the specified radix, it ignores it and all succeeding characters and returns the
      // integer value parsed up to that point. For example, although 1e3 technically encodes an integer (and will be correctly parsed to the integer
      // 1000 by parseFloat()), parseInt("1e3", 10) returns 1, because e is not a valid numeral in base 10. Because . is not a numeral either, the return
      // value will always be an integer.

      // So, check the the entire string is considered when parsing base 10.
      return workerId.toString() === dirName && workerIds.includes(workerId);
    });
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

    // Check that there are no existing archive files, for unambiguous upload
    {
      const archiveFiles = await listArchiveFiles('.');
      if (archiveFiles.length > 0)
        log(LogLevel.Warn, `Multiple AppMap archives found in ${join(process.cwd())}`);
    }

    log(LogLevel.Info, 'Building merged archive');
    const archiveOptions: ArchiveOptions = {analyze: false};
    if (this.revision) archiveOptions.revision = this.revision;
    await this.appMapCommand.archive(archiveOptions);

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

    log(LogLevel.Info, 'Saving archive');
    const archiveFile = await locateArchiveFile('.');
    return await uploadArtifact(this.artifactStore, archiveFile);
  }

  async unpackArchive(archiveId: string) {
    const options: RestoreOptions = {revision: archiveId, exact: true};
    await this.appMapCommand.restore(options);

    const workDir = join('.appmap/work', archiveId);
    const workDirStats = await stat(workDir);
    assert(workDirStats.isDirectory(), `${workDir} does not exist`);
  }
}

async function runInGitHub() {
  verbose(core.getInput('verbose'));
  setLogger(new ActionLogger());

  const archiveCount = core.getInput('archive-count');
  assert(archiveCount, 'archive-count is not set');
  const revision = core.getInput('revision') || process.env.GITHUB_SHA;

  const action = new Merge(parseInt(archiveCount, 10));
  ArchiveAction.applyGitHubActionInputs(action);

  if (revision) action.revision = revision;

  await action.merge();
}

async function runLocally() {
  const parser = new ArgumentParser({
    description: 'Merge AppMap archives from a matrix build',
  });
  parser.add_argument('-v', '--verbose');
  parser.add_argument('-d', '--directory', {help: 'Program working directory'});
  parser.add_argument('--artifact-dir', {default: '.appmap/artifacts'});
  parser.add_argument('--appmap-command', {default: 'appmap'});
  parser.add_argument('-r', '--revision', {help: 'Git revision'});
  parser.add_argument('-c', '--archive-count', {required: true});
  parser.add_argument('--job-run-id', {required: true});
  parser.add_argument('--job-attempt-id', {required: true});

  const options = parser.parse_args();
  const {
    directory,
    archive_count: archiveCount,
    artifact_dir: artifactDir,
    revision,
    appmap_command: appmapCommand,
    job_run_id: jobRunId,
    job_attempt_id: jobAttemptId,
  } = options;

  verbose(options.verbose);

  if (directory) process.chdir(directory);

  const action = new Merge(parseInt(archiveCount, 10));
  action.jobRunId = jobRunId;
  action.jobAttemptId = jobAttemptId;
  if (appmapCommand) {
    const appMapCommand = new CLIAppMapCommand();
    appMapCommand.toolsCommand = appmapCommand;
    action.appMapCommand = appMapCommand;
  }
  action.artifactStore = new DirectoryArtifactStore(artifactDir);
  action.cacheStore = new LocalCacheStore();
  if (revision) action.revision = revision;
  await action.merge();
}

if (require.main === module) {
  if (process.env.CI) runInGitHub();
  else runLocally();
}
