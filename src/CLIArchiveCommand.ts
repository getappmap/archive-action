import {executeCommand, verbose} from '@appland/action-utils';

import ArchiveCommand, {ArchiveOptions, INVENTORY_DIR, RestoreOptions} from './ArchiveCommand';
import {mkdir} from 'fs/promises';
import {join} from 'path';

export default class CLIArchiveCommand implements ArchiveCommand {
  public toolsCommand = 'appmap';

  async archive(options: ArchiveOptions): Promise<void> {
    let command = `${this.toolsCommand} archive`;
    if (verbose()) command += ' --verbose';
    if (options.analyze === false) command += ' --no-analyze';
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

  async generateConfigurationReport(revision: string): Promise<void> {
    const directory = join(INVENTORY_DIR);
    await mkdir(directory, {recursive: true});

    {
      let command = `${this.toolsCommand} inventory`;
      if (verbose()) command += ' --verbose';
      command += ' ' + join(directory, `${revision}.json`);
      await executeCommand(command);
    }
    {
      let command = `${this.toolsCommand} inventory-report`;
      if (verbose()) command += ' --verbose';
      command += ' --template-name welcome';
      command += ' ' + join(directory, `${revision}.json`);
      command += ' ' + join(directory, `${revision}.md`);
      await executeCommand(command);
    }
  }

  async generateOpenAPI(): Promise<void> {
    let command = `${this.toolsCommand} openapi --output-file openapi.yml`;
    if (verbose()) command += ' --verbose';
    await executeCommand(command);
  }
}
