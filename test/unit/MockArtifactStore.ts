import {ArtifactStore} from '@appland/action-utils';

export class MockArtifactStore implements ArtifactStore {
  public artifacts = new Map<string, string | string[]>();

  async uploadArtifact(name: string, paths: string[], retentionDays?: number): Promise<void> {
    const pathArg: string | string[] = paths.length === 1 ? paths[0] : paths;
    this.artifacts.set(name, pathArg);
  }
}
