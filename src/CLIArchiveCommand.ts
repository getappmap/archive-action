import {executeCommand} from './executeCommand';
import ArchiveCommand, {ArchiveOptions, RestoreOptions} from './ArchiveCommand';
import verbose from './verbose';

export default class CLIArchiveCommand implements ArchiveCommand {
  public toolsCommand = 'appmap';

  async archive(options: ArchiveOptions): Promise<void> {
    let command = `${this.toolsCommand} archive`;
    if (verbose()) command += ' --verbose';
    if (options.index === false) command += ' --no-index';
    if (options.revision) command += ` --revision ${options.revision}`;
    await executeCommand(command);
  }

  async restore(options: RestoreOptions): Promise<void> {
    let command = `${this.toolsCommand} restore`;
    if (verbose()) command += ' --verbose';
    if (options.revision) command += ` --revision ${options.revision}`;
    if (options.exact) command += ' --exact';
    await executeCommand(command);
  }
}
