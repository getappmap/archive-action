export default interface CacheStore {
  /**
   * Wrap fs rename so that it can be asserted.
   */
  rename(from: string, to: string): Promise<void>;

  save(paths: string[], key: string): Promise<void>;

  restore(paths: string[], key: string): Promise<void>;
}
