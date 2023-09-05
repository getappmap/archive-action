import {stat} from 'node:fs/promises';
import ArtifactStore from './ArtifactStore';
import verbose from './verbose';
import {join} from 'node:path';

const MetadataFile = 'appmap-metadata.json';
const MetadataPath = join('.appmap', MetadataFile);

export default async function uploadMetadata(store: ArtifactStore) {
  try {
    const stats = await stat(MetadataPath);
    if (!stats.isFile()) {
      throw new Error('appmap-metadata.json is not a file');
    }
  } catch (e) {
    console.warn('No metadata file found');
    if (verbose()) console.warn(e);
    return;
  }

  try {
    await store.uploadArtifact(MetadataFile, MetadataPath);
  } catch (e) {
    console.warn('Failed to upload metadata file');
    if (verbose()) console.warn(e);
  }
}
