import {executeCommand} from '@appland/action-utils';
import {existsSync} from 'fs';
import {join} from 'path';

import * as test from './helper';

describe('archive command', () => {
  let context: test.ArchiveTestContext;

  beforeEach(async () => (context = new test.ArchiveTestContext()));
  beforeEach(async () => await context.setup());

  afterEach(async () => (context ? await context.teardown() : undefined));

  it('operates on a sample project', async () => {
    await executeCommand(
      `env CI= node dist/archive/index.js -d ${context.workDir} --revision deadbeef`,
      {
        printCommand: true,
        printStdout: true,
        printStderr: true,
      }
    );

    expect(existsSync(join(context.workDir, '.appmap/archive/full/deadbeef.tar'))).toBeTruthy();
    expect(existsSync(join(context.workDir, '.appmap/artifacts/deadbeef.tar'))).toBeTruthy();
  });
});
