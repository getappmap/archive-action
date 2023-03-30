import * as core from '@actions/core';
import Archiver, {Logger} from './Archiver';
import verbose from './verbose';

class ActionLogger implements Logger {
  debug(message: string): void {
    core.debug(message);
  }

  info(message: string): void {
    core.info(message);
  }

  warn(message: string): void {
    core.warning(message);
  }
}

function usage(): string {
  return `Usage: node ${process.argv[1]}`;
}

export interface ArchiveResults {
  branchStatus: string[];
}

async function runInGitHub(): Promise<ArchiveResults> {
  core.debug(`Env var 'CI' is set. Running as a GitHub action.`);
  verbose(core.getBooleanInput('verbose'));
  const archiver = new Archiver(new ActionLogger());
  return archive(archiver);
}

async function runAsScript(): Promise<ArchiveResults> {
  console.log(`Env var 'CI' is not set. Running as a local script.`);
  const archiver = new Archiver();
  return archive(archiver);
}

export async function archive(archiver: Archiver): Promise<ArchiveResults> {
  return await archiver.archive();
}

if (require.main === module) {
  if (process.env.CI) {
    runInGitHub();
  } else {
    runAsScript();
  }
}
