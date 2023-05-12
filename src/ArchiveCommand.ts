export type ArchiveOptions = {
  revision?: string;
  index?: boolean;
};

export type RestoreOptions = {
  revision?: string;
  exact: boolean;
};

export default interface ArchiveCommand {
  archive(options: ArchiveOptions): Promise<void>;

  restore(options: RestoreOptions): Promise<void>;
}
