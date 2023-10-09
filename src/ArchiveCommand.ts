export type ArchiveOptions = {
  revision?: string;
  index?: boolean;
  threadCount?: number;
};

export type RestoreOptions = {
  revision?: string;
  exact: boolean;
};

export const INVENTORY_DIR = '.appmap/inventory';

export default interface ArchiveCommand {
  archive(options: ArchiveOptions): Promise<void>;

  restore(options: RestoreOptions): Promise<void>;

  generateInventoryReport(revision: string): Promise<void>;

  generateOpenAPI(): Promise<void>;
}
