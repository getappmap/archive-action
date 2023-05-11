import assert from 'assert';
import {Merge} from '../src/merge';
import * as test from './helper';

describe('merge', () => {
  let context: test.ArchiveTestContext;
  let archiveCount = 2;
  let action: Merge;

  beforeEach(async () => {
    context = new test.ArchiveTestContext();
    await context.setup();
    action = new Merge(archiveCount);
    action.artifactStore = context.artifactStore;
    action.cacheStore = context.noCacheStore;
    action.archiveCommand = context.archiveCommand;
    action.jobAttemptId = 1;
    action.jobRunId = 1;
  });

  afterEach(() => {
    assert(context);
    context.teardown();
  });
});
