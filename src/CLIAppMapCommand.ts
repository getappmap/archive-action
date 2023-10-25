import {executeCommand, verbose} from '@appland/action-utils';
import AppMapCommand, {ArchiveOptions, INVENTORY_DIR, RestoreOptions} from './AppMapCommand';
import {mkdir} from 'fs/promises';
import {join} from 'path';

export default class CLIAppMapCommand implements AppMapCommand {
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
    await mkdir(INVENTORY_DIR, {recursive: true});

    {
      let command = `${this.toolsCommand} inventory`;
      if (verbose()) command += ' --verbose';
      command += ' ' + join(INVENTORY_DIR, `${revision}.json`);
      await executeCommand(command);
    }
    {
      let command = `${this.toolsCommand} inventory-report`;
      if (verbose()) command += ' --verbose';
      command += ' --template-name welcome';
      command += ' ' + join(INVENTORY_DIR, `${revision}.json`);
      command += ' ' + join(INVENTORY_DIR, `${revision}.md`);
      await executeCommand(command);
    }
  }
}
