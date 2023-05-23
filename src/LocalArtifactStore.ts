import ArtifactStore from './ArtifactStore';
import log, {LogLevel} from './log';

export default class LocalArtifactStore implements ArtifactStore {
  uploadArtifact(name: string, path: string): Promise<void> {
    log(
      LogLevel.Info,
      `Mock-uploading artifact ${name} from ${path}. This is currently a nop in local mode.`
    );
    return Promise.resolve();
  }
}
