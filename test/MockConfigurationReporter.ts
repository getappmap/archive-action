import {ArtifactStore} from '@appland/action-utils';
import AppMapCommand from '../src/AppMapCommand';
import ConfigurationReporter from '../src/ConfigurationReporter';

type Report = {
  revision: string;
  githubToken?: string;
};

export default class MockConfigurationReporter implements ConfigurationReporter {
  public reports = new Array<Report>();

  // By default, configuration is reported.
  async shouldReportConfiguration(_revision?: string): Promise<boolean> {
    return true;
  }

  // Configuration reports are stored in an array.
  async report(
    revision: string,
    _appMapCommand: AppMapCommand,
    _artifactStore: ArtifactStore,
    githubToken?: string
  ): Promise<void> {
    this.reports.push({revision, githubToken});
  }
}
