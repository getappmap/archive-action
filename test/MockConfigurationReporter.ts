import ArchiveCommand from '../src/ArchiveCommand';
import ArtifactStore from '../src/ArtifactStore';
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
    _archiveCommand: ArchiveCommand,
    _artifactStore: ArtifactStore,
    githubToken?: string
  ): Promise<void> {
    this.reports.push({revision, githubToken});
  }
}
