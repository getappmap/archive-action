import {readFile, rename, rm, writeFile} from 'fs/promises';
import {basename, dirname, join} from 'path';
import {executeCommand} from './executeCommand';
import log, {LogLevel} from './log';

export interface ArtifactStore {
  uploadArtifact(name: string, path: string): Promise<void>;
}

async function applyCommand(command: string | undefined) {
  if (!command) return;

  await executeCommand(command);
}

export default class Archiver {
  public toolsPath = '/tmp/appmap';
  public archiveBranch = 'appmap-archive';
  public revision?: boolean | string;
  public commit = false;
  public push = true;

  constructor(public artifactStore: ArtifactStore) {}

  async archive(): Promise<{branchStatus: string[]}> {
    log(LogLevel.Info, `Archiving AppMaps from ${process.cwd()}`);

    const revision = this.revision === false ? undefined : this.revision || process.env.GITHUB_SHA;
    let archiveCommand = `${this.toolsPath} archive`;
    if (revision) archiveCommand += ` --revision ${revision}`;
    await executeCommand(archiveCommand);

    const branchStatus = (await executeCommand('git status -u -s -- .appmap')).trim().split('\n');
    log(LogLevel.Debug, `Branch status is:\n${branchStatus}`);

    const archiveFiles = branchStatus
      .map(status => status.split(' ')[1])
      .filter(path => path.endsWith('.tar'));

    if (archiveFiles.length === 0) {
      log(LogLevel.Warn, `No AppMap archives found in ${process.cwd()}`);
      return {branchStatus};
    }
    if (archiveFiles.length > 1) {
      log(LogLevel.Warn, `Mulitple AppMap archives found in ${process.cwd()}`);
    }

    for (const archiveFile of archiveFiles) {
      log(LogLevel.Debug, `Processing AppMap archive ${archiveFile}`);

      // e.g. .appmap/archive/full
      const dir = dirname(archiveFile);
      // e.g. appmap-archive-full
      const artifactPrefix = dir.replace(/\//g, '-').replace(/\./g, '');
      const [sha] = basename(archiveFile).split('.');
      const artifactName = `${artifactPrefix}_${sha}.tar`;

      await this.artifactStore.uploadArtifact(artifactName, archiveFile);
    }

    if (this.commit) {
      log(LogLevel.Info, `Committing artifact metadata to ${this.archiveBranch}`);

      const revision = (await executeCommand('git rev-parse HEAD')).trim();
      let ref = process.env.GITHUB_REF;
      if (ref) ref = [ref, `(${revision})`].join(' ');
      else ref = revision;

      log(LogLevel.Debug, `Revision is ${revision} on ref ${ref}`);

      await applyCommand(`git fetch`);
      await applyCommand(`git stash -u -- .appmap`);
      await applyCommand(`git checkout ${this.archiveBranch}`);
      await applyCommand(`git stash apply`);
      await applyCommand(`git add .appmap`);
      await applyCommand(
        `git -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" commit --author="Author <actions@github.com> " -m "chore: AppMaps for ${ref}"`
      );

      if (this.push) {
        log(LogLevel.Info, `Pushing artifact metadata to ${this.archiveBranch}`);
        await applyCommand(`git push origin ${this.archiveBranch}`);
      }

      await applyCommand(`git checkout ${revision}`);
      await applyCommand(`git stash pop`);
    }

    return {branchStatus};
  }
}
