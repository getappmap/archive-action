import CacheStore from './CacheStore';
import log, {LogLevel} from './log';

export default class LocalCacheStore implements CacheStore {
  save(paths: string[], key: string): Promise<void> {
    log(
      LogLevel.Info,
      `Mock-saving cache ${key} with paths ${paths.join(
        ', '
      )}. This is currently a nop in local mode.`
    );
    return Promise.resolve();
  }
  restore(paths: string[], key: string): Promise<void> {
    log(
      LogLevel.Info,
      `Mock-restoring cache ${key} with paths ${paths.join(
        ', '
      )}. This is currently a nop in local mode.`
    );
    return Promise.resolve();
  }
}
