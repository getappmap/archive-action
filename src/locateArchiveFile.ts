import {existsSync} from 'fs';
import {glob} from 'glob';
import {join} from 'path';
import {log, LogLevel} from '@appland/action-utils';
import {stat} from 'fs/promises';

export default async function locateArchiveFile(workDir: string): Promise<string> {
  const archiveFiles = (
    await glob(join(workDir, '.appmap', 'archive', '**', '*.tar'), {dot: true})
  ).filter(file => existsSync(file));
  const archiveFileTimes = new Map<string, number>();
  await Promise.all(
    archiveFiles.map(async file => archiveFileTimes.set(file, (await stat(file)).mtimeMs))
  );
  archiveFiles.sort((a, b) => archiveFileTimes.get(b)! - archiveFileTimes.get(a)!);

  if (archiveFiles.length === 0)
    throw new Error(`No AppMap archives found in ${join(process.cwd(), workDir)}`);

  const result = archiveFiles.shift()!;

  if (archiveFiles.length > 1) {
    log(
      LogLevel.Warn,
      `Multiple AppMap archives found in ${join(
        process.cwd(),
        workDir
      )}.\nI'll upload the most recent one, which is ${result}.`
    );
  }

  log(LogLevel.Debug, `archiveFile: ${result}`);

  return result;
}
