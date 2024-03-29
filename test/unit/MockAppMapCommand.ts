import AppMapCommand, {ArchiveOptions, RestoreOptions} from '../../src/AppMapCommand';

export class MockAppMapCommand implements AppMapCommand {
  public commands: {command: string; options: any}[] = [];

  async archive(options: ArchiveOptions): Promise<void> {
    this.commands.push({command: 'archive', options});
  }

  async restore(options: RestoreOptions): Promise<void> {
    this.commands.push({command: 'restore', options});
  }

  async generateConfigurationReport(revision: string): Promise<void> {
    this.commands.push({command: 'inventory', options: {revision}});
  }
}
