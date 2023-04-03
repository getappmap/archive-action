import {exec} from 'child_process';
import verbose from './verbose';

export function executeCommand(
  cmd: string,
  printCommand = verbose(),
  printStdout = verbose(),
  printStderr = verbose()
): Promise<string> {
  if (printCommand) console.log(cmd);
  const command = exec(cmd);
  const result: string[] = [];
  const stderr: string[] = [];
  if (command.stdout) {
    command.stdout.addListener('data', data => {
      if (printStdout) process.stdout.write(data);
      result.push(data);
    });
  }
  if (command.stderr) {
    if (printStderr) command.stderr.pipe(process.stdout);
    else command.stderr.addListener('data', data => stderr.push(data));
  }
  return new Promise<string>((resolve, reject) => {
    command.addListener('exit', code => {
      if (code === 0) {
        resolve(result.join(''));
      } else {
        if (!printCommand) console.log(cmd);
        console.warn(stderr.join(''));
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}
