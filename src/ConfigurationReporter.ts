import {ArtifactStore} from '@appland/action-utils';
import AppMapCommand from './AppMapCommand';

export default interface ConfigurationReporter {
  shouldReportConfiguration(revision?: string): Promise<boolean>;

  report(
    revision: string,
    appMapCommand: AppMapCommand,
    artifactStore: ArtifactStore,
    githubToken?: string
  ): Promise<void>;
}
