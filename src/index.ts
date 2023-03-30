import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import assert from 'assert';
import Installer, {Logger} from './Archiver';
import verbose from './verbose';
import {readFile} from 'fs/promises';
import Archiver from './Archiver';

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

export interface ArchiveResults {}

export async function runInGitHub(): Promise<ArchiveResults> {
  core.debug(`Env var 'CI' is set. Running as a GitHub action.`);
  verbose(core.getBooleanInput('verbose'));
  const archiver = new Archiver(new ActionLogger());
  return archive(archiver);
}

export async function runAsScript(appmapToolsURL: string): Promise<ArchiveResults> {
  console.log(`Env var 'CI' is not set. Running as a local script.`);
  const archiver = new Archiver();
  return archive(archiver);
}

async function archive(installer: Archiver): Promise<ArchiveResults> {}

if (require.main === module) {
  if (process.env.CI) {
    runInGitHub();
  } else {
    runAsScript();
  }
}
