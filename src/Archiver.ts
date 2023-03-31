import assert from 'assert';
import {stat} from 'fs/promises';
import {basename} from 'path';
import {executeCommand} from './executeCommand';

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
}

export interface ArtifactStore {
  uploadArtifact(name: string, path: string): Promise<void>;
}

export default class Archiver {
  public toolsPath = '/tmp/appmap';
  public archiveBranch = 'appmap-archive';
  public push = true;

  constructor(public artifactStore: ArtifactStore, public logger: Logger = console) {}

  async archive(): Promise<{branchStatus: string[]}> {
    this.logger.info(`Archiving AppMaps from ${process.cwd()}`);

    const archiveCommand = `${this.toolsPath} archive`;
    await executeCommand(archiveCommand);

    const branchStatus = (await executeCommand('git status -s')).trim().split('\n');

    const revision = (await executeCommand('git rev-parse HEAD')).trim();
    let ref = process.env.GITHUB_REF;
    if (ref) ref = [ref, `(${revision})`].join(' ');
    else ref = revision;

    const applyCommand = async (command: string | undefined) => {
      if (!command) return;

      await executeCommand(command);
    };

    await applyCommand(`git fetch`);
    await applyCommand(`git stash -u -- .appmap`);
    await applyCommand(`git checkout ${this.archiveBranch}`);
    await applyCommand(`git stash apply`);
    await applyCommand(`git add .appmap`);
    await applyCommand(
      `git -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" commit --author="Author <actions@github.com> " -m "chore: AppMaps for ${ref}"`
    );
    if (this.push) await applyCommand(`git push origin ${this.archiveBranch}`);
    await applyCommand(`git checkout ${revision}`);
    await applyCommand(`git stash pop`);

    const archiveFiles = branchStatus
      .map(status => status.split(' ')[1])
      .filter(path => path.endsWith('.tar'));
    for (const archiveFile of archiveFiles) {
      const [sha] = basename(archiveFile).split('.');
      await this.artifactStore.uploadArtifact(sha, archiveFile);
    }

    return {branchStatus};
  }
}
