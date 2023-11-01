import {Octokit} from '@octokit/rest';
import {getOctokit} from '@actions/github';
import {Commenter} from '@appland/action-utils';
import {ActionCommenter} from './GitHubConfigurationReporter';

export default class GitHubCommenter implements ActionCommenter {
  async comment(credential: string, inventoryReportFile: string) {
    const octokit = getOctokit(credential) as unknown as Octokit;
    const commenter = new Commenter(octokit, 'appmap-configuration');
    await commenter.comment(inventoryReportFile);
  }
}
