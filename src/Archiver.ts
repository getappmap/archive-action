import {readFile, rename, rm, writeFile} from 'fs/promises';
import {basename, dirname, join} from 'path';
import {executeCommand} from './executeCommand';
import {Logger} from './Logger';

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

  constructor(public artifactStore: ArtifactStore, public logger: Logger = console) {}

  async archive(): Promise<{branchStatus: string[]}> {
    this.logger.info(`Archiving AppMaps from ${process.cwd()}`);

    const revision = this.revision === false ? undefined : this.revision || process.env.GITHUB_SHA;
    let archiveCommand = `${this.toolsPath} archive`;
    if (revision) archiveCommand += ` --revision ${revision}`;
    await executeCommand(archiveCommand);

    const branchStatus = (await executeCommand('git status -u -s -- .appmap')).trim().split('\n');

    const archiveFiles = branchStatus
      .map(status => status.split(' ')[1])
      .filter(path => path.endsWith('.tar'));

    for (const archiveFile of archiveFiles) {
      // e.g. .appmap/archive/full
      const dir = dirname(archiveFile);
      // e.g. appmap-archive-full
      const artifactPrefix = dir.replace(/\//g, '-').replace(/\./g, '');
      const [sha] = basename(archiveFile).split('.');
      const manifestFilename = `${artifactPrefix}_${sha}.json`;
      const appmapsFilename = `${artifactPrefix}_${sha}.tar.gz`;

      // Extract the archive so that the individual files can be uploaded as artifacts.
      // This way, a clien can cheaply download the manifest JSON file and decide
      // whether to pull the AppMap tarball.
      await executeCommand(`tar xf ${archiveFile} -C ${dir}`);

      // Upload the AppMaps tarball as e.g. appmap-archive-full_<sha>.tar.gz
      await this.artifactStore.uploadArtifact(appmapsFilename, join(dir, 'appmaps.tar.gz'));

      // Inject the GitHub artifact name into the manifest JSON file.
      const manifestData = JSON.parse(await readFile(join(dir, 'appmap_archive.json'), 'utf8'));
      manifestData['github_artifact_name'] = appmapsFilename;
      await writeFile(join(dir, 'appmap_archive.json'), JSON.stringify(manifestData, null, 2));

      await this.artifactStore.uploadArtifact(manifestFilename, join(dir, 'appmap_archive.json'));
    }

    if (this.commit) {
      const revision = (await executeCommand('git rev-parse HEAD')).trim();
      let ref = process.env.GITHUB_REF;
      if (ref) ref = [ref, `(${revision})`].join(' ');
      else ref = revision;

      await applyCommand(`git fetch`);
      await applyCommand(`git stash -u -- .appmap`);
      await applyCommand(`git checkout ${this.archiveBranch}`);
      await applyCommand(`git stash apply`);
      await applyCommand(`git add .appmap`);
      await applyCommand(
        `git -c user.name="github-actions[bot]" -c user.email="github-actions[bot]@users.noreply.github.com" commit --author="Author <actions@github.com> " -m "chore: AppMaps for ${ref}"`
      );

      if (this.push) {
        await applyCommand(`git push origin ${this.archiveBranch}`);
      }

      await applyCommand(`git checkout ${revision}`);
      await applyCommand(`git stash pop`);
    }

    return {branchStatus};
  }
}
