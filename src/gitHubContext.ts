import {context} from '@actions/github';
import {LogLevel, executeCommand, log} from '@appland/action-utils';
import {inspect} from 'util';

// Detect the SHA of the base ref, if available.
// Begin by checking whether the base ref is available on this node. If not,
// use `git ls-remote` to get the SHA.
export async function baseSha(): Promise<string | undefined> {
  const baseRef = context.payload.pull_request?.base.ref;
  log(LogLevel.Debug, `Base ref is ${inspect(baseRef)}`);
  if (!baseRef) return;

  const remote = (await executeCommand(`git remote`, {printCommand: true})).trim();
  log(LogLevel.Debug, `Remote is ${remote}`);

  const remoteData = (
    await executeCommand(`git ls-remote --heads --refs ${remote} ${baseRef}`, {
      printCommand: true,
      printStdout: true,
      printStderr: true,
    })
  ).trim();

  log(LogLevel.Debug, `Base SHA can be parsed from ${remoteData}`);
  const baseSha = remoteData.split('\t')[0];
  log(LogLevel.Debug, `Base SHA is ${baseSha}`);

  return baseSha;
}
