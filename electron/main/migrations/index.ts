export type IMigration = {
  run(): void | Promise<void>;

  id(): string;
};
