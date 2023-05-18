import * as artifact from '@actions/artifact';
import ArtifactStore from './ArtifactStore';

export default class GitHubArtifactStore implements ArtifactStore {
  async uploadArtifact(name: string, path: string): Promise<void> {
    const artifactClient = artifact.create();
    await artifactClient.uploadArtifact(name, [path], process.cwd());
  }
}
