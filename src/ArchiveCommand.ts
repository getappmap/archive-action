export type ArchiveOptions = {
  revision?: string;
  index?: boolean;
};

export default interface ArchiveCommand {
  archive(options?: ArchiveOptions): Promise<void>;
}
