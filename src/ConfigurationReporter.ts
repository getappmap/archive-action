import { ArtifactStore } from '@appland/action-utils';
import ArchiveCommand from './ArchiveCommand';

export default interface ConfigurationReporter {
  shouldReportConfiguration(revision?: string): Promise<boolean>;

  report(
    revision: string,
    archiveCommand: ArchiveCommand,
    artifactStore: ArtifactStore,
    githubToken?: string
  ): Promise<void>;
}
