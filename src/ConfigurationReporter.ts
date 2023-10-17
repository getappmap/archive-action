import ArchiveCommand from './ArchiveCommand';
import ArtifactStore from './ArtifactStore';

export default interface ConfigurationReporter {
  shouldReportConfiguration(revision?: string): Promise<boolean>;

  report(
    revision: string,
    archiveCommand: ArchiveCommand,
    artifactStore: ArtifactStore,
    githubToken?: string
  ): Promise<void>;
}
