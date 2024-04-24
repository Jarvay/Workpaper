import { configServiceMain } from './db-service';
import { IMigration } from '../migrations';
import { Migration_202404223_1539 } from '../migrations/migration_202404223_1539';

const MIGRATIONS: IMigration[] = [new Migration_202404223_1539()];

export async function runMigrations() {
  const executedMigrations = configServiceMain.getItem('migrations');
  for (const migration of MIGRATIONS) {
    const id = migration.constructor.name;
    if (!executedMigrations.includes(id)) {
      await migration.run();
      executedMigrations.push(id);
    }
  }
  configServiceMain.setItem('migrations', executedMigrations);
}
