import {LogLevel, log} from '@appland/action-utils';
import {basename, dirname} from 'path';

export default interface ArtifactStore {
  uploadArtifact(name: string, path: string): Promise<void>;
}

export async function uploadArtifact(
  archiveFile: string,
  artifactStore: ArtifactStore
): Promise<{archiveFile: string}> {
  log(LogLevel.Debug, `Processing AppMap archive ${archiveFile}`);

  // e.g. .appmap/archive/full
  const dir = dirname(archiveFile);
  // e.g. appmap-archive-full
  const artifactPrefix = dir.replace(/\//g, '-').replace(/\./g, '');
  const [sha] = basename(archiveFile).split('.');
  const artifactName = `${artifactPrefix}_${sha}.tar`;

  await artifactStore.uploadArtifact(artifactName, archiveFile);

  return {archiveFile};
}
