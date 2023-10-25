import {Commenter, LogLevel, log, ArtifactStore, uploadArtifact} from '@appland/action-utils';

import ArchiveCommand from './ArchiveCommand';
import {baseSha as computeBaseSha} from './gitHubContext';
import ConfigurationReporter from './ConfigurationReporter';
import GitHubCommenter from './GitHubCommenter';

export interface ActionCommenter {
  comment(credential: string, inventoryReportFile: string): Promise<void>;
}

export default class GitHubConfigurationReporter implements ConfigurationReporter {
  public commenter: ActionCommenter = new GitHubCommenter();

  async shouldReportConfiguration(revision?: string) {
    return (
      GitHubConfigurationReporter.testIssueNumber() &&
      (await GitHubConfigurationReporter.testRevision(revision))
    );
  }

  async report(
    revision: string,
    archiveCommand: ArchiveCommand,
    artifactStore: ArtifactStore,
    githubToken?: string
  ) {
    const inventoryDataFile = `.appmap/inventory/${revision}.json`;
    const inventoryReportFile = `.appmap/inventory/${revision}.md`;
    {
      log(LogLevel.Info, `Generating inventory file ${inventoryReportFile}`);
      await archiveCommand.generateConfigurationReport(revision);
      log(LogLevel.Info, `Uploading inventory data ${inventoryDataFile}`);
      await uploadArtifact(artifactStore, inventoryDataFile);
    }

    if (githubToken) {
      log(LogLevel.Info, `Commenting on issue or pull request with configuration report`);
      await this.commenter.comment(githubToken, inventoryReportFile);
    } else {
      log(LogLevel.Warn, 'GitHub token is not set, skipping PR comment');
    }
  }

  protected static async testRevision(revision?: string): Promise<boolean> {
    if (!revision) {
      log(LogLevel.Debug, `Revision is not available, skipping inventory`);
      return false;
    }

    const baseSha = await computeBaseSha();
    if (revision !== baseSha) {
      log(
        LogLevel.Debug,
        `Revision ${revision} is not the same as the base ref SHA ${baseSha}, skipping inventory`
      );
      return false;
    }

    log(
      LogLevel.Debug,
      `Revision ${revision} is the same as the base ref SHA ${baseSha}. Will emit inventory if an issue number is available`
    );

    return true;
  }

  // Public so it can be a testing hook.
  static testIssueNumber(): boolean {
    const result = Commenter.hasIssueNumber();
    if (result) log(LogLevel.Debug, `Issue number is ${Commenter.issueNumber()}`);
    else log(LogLevel.Debug, `Issue number is not available`);
    return result;
  }
}
