import ArchiveCommand, {ArchiveOptions} from '../src/ArchiveCommand';

export class MockArchiveCommand implements ArchiveCommand {
  public commands: ArchiveOptions[] = [];

  async archive(options?: ArchiveOptions | undefined): Promise<void> {
    this.commands.push(options || {});
  }
}
