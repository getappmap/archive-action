import {ActionCommenter} from '../../src/GitHubConfigurationReporter';

export default class MockCommenter implements ActionCommenter {
  public reportFiles = new Array<string>();

  async comment(credential: string, inventoryReportFile: string) {
    this.reportFiles.push(inventoryReportFile);
  }
}
