import {join} from 'path';
import verbose from '../src/verbose';
import {mkdtempSync} from 'fs';

export const pwd = process.cwd();
export const fixtureDir = join(__dirname, 'fixture');

export function makeWorkDir(): string {
  return mkdtempSync(join(__dirname, 'work', 'archive-appmap-action-'));
}

if (process.env.VERBOSE) verbose(true);
