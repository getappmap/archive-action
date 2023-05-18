import ArtifactStore from '../src/ArtifactStore';

export class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string>();

  async uploadArtifact(name: string, path: string): Promise<void> {
    this.artifacts.set(name, path);
  }
}
