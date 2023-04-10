import {existsSync} from 'fs';
import {glob} from 'glob';
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

  async archive(): Promise<{archiveFile: string}> {
    log(LogLevel.Info, `Archiving AppMaps from ${process.cwd()}`);

    const {revision} = this;
    let archiveCommand = `${this.toolsPath} archive`;
    if (revision) archiveCommand += ` --revision ${revision}`;
    await executeCommand(archiveCommand);

    const archiveFiles = (
      await glob(join('.appmap', 'archive', '**', '*.tar'), {dot: true})
    ).filter(file => existsSync(file));

    if (archiveFiles.length === 0) {
      throw new Error(`No AppMap archives found in ${process.cwd()}`);
    }
    if (archiveFiles.length > 1) {
      log(LogLevel.Warn, `Mulitple AppMap archives found in ${process.cwd()}`);
    }

    const archiveFile = archiveFiles.pop()!;

    log(LogLevel.Debug, `Processing AppMap archive ${archiveFile}`);

    // e.g. .appmap/archive/full
    const dir = dirname(archiveFile);
    // e.g. appmap-archive-full
    const artifactPrefix = dir.replace(/\//g, '-').replace(/\./g, '');
    const [sha] = basename(archiveFile).split('.');
    const artifactName = `${artifactPrefix}_${sha}.tar`;

    await this.artifactStore.uploadArtifact(artifactName, archiveFile);

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

    return {archiveFile};
  }
}
