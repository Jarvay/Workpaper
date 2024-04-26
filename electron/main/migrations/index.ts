export interface IMigration {
  run(): void | Promise<void>;
}
