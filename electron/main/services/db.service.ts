import { IDBService } from '../../../cross/interface';
import { JSONSyncPreset } from 'lowdb/node';
import { join } from 'node:path';
import { LowSync } from 'lowdb';
import { userDataDir } from './utils';

export class DBServiceMain<DataType> implements IDBService<DataType> {
  private db: LowSync<DataType>;

  constructor(db: LowSync<DataType>) {
    this.db = db;
  }

  setItem<Key extends keyof DataType>(key: Key, data: DataType[Key]) {
    this.db.data[key] = data;
    this.db.write();
  }

  getItem<Key extends keyof DataType>(key: Key) {
    return this.db.data[key];
  }
}

export const tmpDataServiceMain = new DBServiceMain<{ currentIndex: number }>(
  JSONSyncPreset(join(userDataDir, 'tmpData.json'), {
    currentIndex: 0,
  }),
);
