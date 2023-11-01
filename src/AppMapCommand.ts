export type ArchiveOptions = {
  revision?: string;
  analyze?: boolean;
  threadCount?: number;
};

export type RestoreOptions = {
  revision?: string;
  exact: boolean;
};

export const INVENTORY_DIR = '.appmap/inventory';

export default interface AppMapCommand {
  archive(options: ArchiveOptions): Promise<void>;

  restore(options: RestoreOptions): Promise<void>;

  generateConfigurationReport(revision: string): Promise<void>;
}
