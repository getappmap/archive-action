import {executeCommand} from './executeCommand';
import ArchiveCommand, {ArchiveOptions} from './ArchiveCommand';

export default class CLIArchiveCommand implements ArchiveCommand {
  public toolsCommand = 'appmap';

  async archive(options: ArchiveOptions): Promise<void> {
    let archiveCommand = `${this.toolsCommand} archive`;
    if (options.index === false) archiveCommand += ' --no-index';
    if (options.revision) archiveCommand += ` --revision ${options.revision}`;
    await executeCommand(archiveCommand);
  }
}
