export default interface ArtifactStore {
  uploadArtifact(name: string, path: string): Promise<void>;
}
