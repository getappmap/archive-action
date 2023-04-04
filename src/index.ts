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
  branchStatus: string[];
}

async function runInGitHub(): Promise<ArchiveResults> {
  verbose(core.getBooleanInput('verbose'));
  const commitSHA = core.getInput('commit-sha');
  const archiver = new Archiver(new GitHubArtifactStore());
  if (commitSHA) archiver.revision = commitSHA;
  return archiver.archive();
}

if (require.main === module) {
  runInGitHub();
}
