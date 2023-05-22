import ArchiveCommand, {ArchiveOptions, RestoreOptions} from '../src/ArchiveCommand';

export class MockArchiveCommand implements ArchiveCommand {
  public commands: {command: string; options: any}[] = [];

  async archive(options: ArchiveOptions): Promise<void> {
    this.commands.push({command: 'archive', options});
  }

  async restore(options: RestoreOptions): Promise<void> {
    this.commands.push({command: 'restore', options});
  }

  async generateOpenAPI(directory: string): Promise<void> {
    this.commands.push({command: 'openapi', options: {directory}});
  }
}
