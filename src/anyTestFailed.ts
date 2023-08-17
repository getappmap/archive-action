import {readFile} from 'fs/promises';
import {glob} from 'glob';
import {join} from 'path';

export default async function anyTestFailed(appmapDir: string): Promise<boolean> {
  let testFailed = false;
  const metadataFiles = await glob(join(appmapDir, '**', 'metadata.json'));
  for (const metadataFile of metadataFiles) {
    const metadata = (await readFile(metadataFile, 'utf-8')) as any;
    if (metadata?.test_status === 'failed') {
      testFailed = true;
      break;
    }
  }
  return testFailed;
}
