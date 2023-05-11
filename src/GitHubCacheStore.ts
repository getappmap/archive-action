import * as cache from '@actions/cache';
import CacheStore from './CacheStore';
import {rename} from 'fs/promises';

export default class GitHubCacheStore implements CacheStore {
  async rename(from: string, to: string): Promise<void> {
    await rename(from, to);
  }

  async save(paths: string[], key: string): Promise<void> {
    await cache.saveCache(paths, key);
  }

  async restore(paths: string[], key: string): Promise<void> {
    await cache.restoreCache(paths, key);
  }
}
