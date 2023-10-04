import ArchiveCommand, {ArchiveOptions, RestoreOptions} from '../src/ArchiveCommand';

export class MockArchiveCommand implements ArchiveCommand {
  public commands: {command: string; options: any}[] = [];

  async archive(options: ArchiveOptions): Promise<void> {
    this.commands.push({command: 'archive', options});
  }

  async restore(options: RestoreOptions): Promise<void> {
    this.commands.push({command: 'restore', options});
  }

  async generateInventoryReport(outputFile: string): Promise<void> {
    this.commands.push({command: 'inventory', options: {outputFile}});
  }

  async generateOpenAPI(): Promise<void> {
    this.commands.push({command: 'openapi', options: {}});
  }
}
