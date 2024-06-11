import { configServiceMain } from './config.service';
import { IMigration } from '../migrations';
import { Migration_202404223_1539 } from '../migrations/migration_202404223_1539';
import { Migration_20240509_1755 } from '../migrations/migration_20240509_1755';

const MIGRATIONS: IMigration[] = [
  new Migration_202404223_1539(),
  new Migration_20240509_1755(),
];

export async function runMigrations() {
  const executedMigrations = configServiceMain.getItem('migrations');
  for (const migration of MIGRATIONS) {
    const id = migration.id();
    if (!executedMigrations.includes(id)) {
      await migration.run();
      executedMigrations.push(id);
    }
  }
  configServiceMain.setItem('migrations', executedMigrations);
}
