import assert from 'assert';
import {executeCommand} from './executeCommand';

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
}

export default class Archiver {
  public toolsPath = '/tmp/appmap';
  public archiveBranch = 'appmap-archive';
  public push = true;

  constructor(public logger: Logger = console) {}

  async archive(): Promise<{branchStatus: string[]}> {
    this.logger.info(`Archiving AppMaps from ${process.cwd()}`);

    const archiveCommand = `${this.toolsPath} archive`;
    await executeCommand(archiveCommand);

    const branchStatus = (await executeCommand('git status -s')).trim().split('\n');

    const revision = (await executeCommand('git rev-parse HEAD')).trim();
    let ref = process.env.GITHUB_REF;
    if (ref) ref = [ref, `(${revision})`].join(' ');
    else ref = revision;
    for (const command of [
      `git fetch`,
      `git add .appmap`,
      `git stash`,
      `git checkout ${this.archiveBranch}`,
      `git stash pop`,
      `git add .appmap`,
      `git config user.email "github-actions[bot]@users.noreply.github.com"`,
      `git config user.name "github-actions[bot]"`,
      `git commit -m "chore: AppMaps for ${ref}"`,
      this.push ? `git push origin ${this.archiveBranch}` : undefined,
      `git checkout ${revision}`,
    ].filter(Boolean)) {
      assert(command);
      await executeCommand(command);
    }

    return {branchStatus};
  }
}
