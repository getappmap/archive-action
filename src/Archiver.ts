export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
}

export default class Archiver {
  constructor(public logger: Logger = console) {}
}
