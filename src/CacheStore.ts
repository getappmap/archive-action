export default interface CacheStore {
  save(paths: string[], key: string): Promise<void>;

  restore(paths: string[], key: string): Promise<void>;
}
