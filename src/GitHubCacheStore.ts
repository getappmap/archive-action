import * as cache from '@actions/cache';
import CacheStore from './CacheStore';

export default class GitHubCacheStore implements CacheStore {
  async save(paths: string[], key: string): Promise<void> {
    await cache.saveCache(paths, key);
  }

  async restore(paths: string[], key: string): Promise<void> {
    await cache.restoreCache(paths, key);
  }
}
