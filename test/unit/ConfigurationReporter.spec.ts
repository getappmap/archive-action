import * as actionUtils from '@appland/action-utils';

import GitHubConfigurationReporter from '../../src/GitHubConfigurationReporter';
import * as gitHubContext from '../../src/gitHubContext';
import MockCommenter from './MockCommenter';
import * as test from './helper';

describe('ConfigurationReporter', () => {
  let context: test.ArchiveTestContext;
  let commenter: MockCommenter;
  let reporter: GitHubConfigurationReporter;

  const baseSha = '402dec8';

  beforeEach(async () => {
    context = new test.ArchiveTestContext();
    await context.setup();

    commenter = new MockCommenter();
    reporter = new GitHubConfigurationReporter();
    reporter.commenter = commenter;
  });
  afterEach(async () => (context ? await context.teardown() : undefined));

  describe('with issue number available', () => {
    beforeEach(() => {
      jest.spyOn(GitHubConfigurationReporter, 'testIssueNumber').mockReturnValue(true);
    });

    describe('with base sha', () => {
      beforeEach(() => jest.spyOn(gitHubContext, 'baseSha').mockResolvedValue(baseSha));

      describe('matching revision', () => {
        const revision = baseSha;

        it('should report configuration', async () => {
          expect(await reporter.shouldReportConfiguration(revision)).toBe(true);
        });
        it('creates and submits the configuration data', async () => {
          const executeCommandSpy = jest.spyOn(actionUtils, 'executeCommand');

          await reporter.report(
            revision,
            context.appMapCommand,
            context.artifactStore,
            'fake-token'
          );

          expect(executeCommandSpy).not.toHaveBeenCalled();

          expect(context.appMapCommand.commands).toEqual([
            {command: 'inventory', options: {revision: '402dec8'}},
          ]);

          expect([...context.artifactStore.artifacts.keys()].sort()).toEqual([
            'appmap-inventory_402dec8.tar',
          ]);

          expect(commenter.reportFiles).toEqual(['.appmap/inventory/402dec8.md']);
        });
      });
      describe('not matching revision', () => {
        const revision = 'other-sha';

        it('should not report configuration', async () => {
          expect(await reporter.shouldReportConfiguration(revision)).toBe(false);
        });
      });
    });
  });
});
