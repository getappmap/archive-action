import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import Archiver, {ArtifactStore} from './Archiver';
import verbose from './verbose';

class GitHubArtifactStore implements ArtifactStore {
  async uploadArtifact(name: string, path: string): Promise<void> {
    const artifactClient = artifact.create();
    await artifactClient.uploadArtifact(name, [path], process.cwd());
  }
}

export interface ArchiveResults {
  archiveFile: string;
}

async function runInGitHub(): Promise<ArchiveResults> {
  verbose(core.getBooleanInput('verbose'));
  // commit-sha is checked for backwards compatibility
  const revision =
    core.getInput('revision') || core.getInput('commit-sha') || process.env.GITHUB_SHA;
  const archiver = new Archiver(new GitHubArtifactStore());
  if (revision) archiver.revision = revision;
  return archiver.archive();
}

if (require.main === module) {
  runInGitHub();
}
