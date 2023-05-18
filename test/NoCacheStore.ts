import CacheStore from '../src/CacheStore';

export class NoCacheStore implements CacheStore {
  rename(from: string, to: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  save(paths: string[], key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  
  restore(paths: string[], key: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
