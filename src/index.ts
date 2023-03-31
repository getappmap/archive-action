import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import Archiver, {Logger, ArtifactStore} from './Archiver';
import verbose from './verbose';

class ActionLogger implements Logger {
  debug(message: string): void {
    core.debug(message);
  }

  info(message: string): void {
    core.info(message);
  }

  warn(message: string): void {
    core.warning(message);
  }
}

class GitHubArtifactStore implements ArtifactStore {
  async uploadArtifact(name: string, path: string): Promise<void> {
    const artifactClient = artifact.create();
    await artifactClient.uploadArtifact(name, [path], process.cwd());
  }
}

function usage(): string {
  return `Usage: node ${process.argv[1]}`;
}

export interface ArchiveResults {
  branchStatus: string[];
}

async function runInGitHub(): Promise<ArchiveResults> {
  verbose(core.getBooleanInput('verbose'));
  const archiver = new Archiver(new GitHubArtifactStore(), new ActionLogger());
  return archive(archiver);
}

export async function archive(archiver: Archiver): Promise<ArchiveResults> {
  return await archiver.archive();
}

if (require.main === module) {
  runInGitHub();
}
