import {executeCommand, verbose} from '@appland/action-utils';

import ArchiveCommand, {ArchiveOptions, RestoreOptions} from './ArchiveCommand';

export default class CLIArchiveCommand implements ArchiveCommand {
  public toolsCommand = 'appmap';

  async archive(options: ArchiveOptions): Promise<void> {
    let command = `${this.toolsCommand} archive`;
    if (verbose()) command += ' --verbose';
    if (options.index === false) command += ' --no-index';
    if (options.revision) command += ` --revision ${options.revision}`;
    if (options.threadCount) command += ` --thread-count ${options.threadCount}`;
    await executeCommand(command, {printStderr: true, printStdout: true});
  }

  async restore(options: RestoreOptions): Promise<void> {
    let command = `${this.toolsCommand} restore`;
    if (verbose()) command += ' --verbose';
    if (options.revision) command += ` --revision ${options.revision}`;
    if (options.exact) command += ' --exact';
    await executeCommand(command);
  }

  async generateOpenAPI(directory: string): Promise<void> {
    let command = `${this.toolsCommand} openapi -d . --appmap-dir ${directory} --output-file openapi.yml`;
    if (verbose()) command += ' --verbose';
    await executeCommand(command);
  }
}
