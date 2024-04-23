import { DBData, IDBService } from '../../../cross/interface';
import { JSONSyncPreset } from 'lowdb/node';
import { join } from 'node:path';
import {
  Locale,
  MacOSScaleMode,
  WallpaperMode,
  WebScaleMode,
  WindowsScaleMode,
} from '../../../cross/enums';
import { LowSync } from 'lowdb';
import { userDataDir } from './utils';
import { platform } from 'os';
import { merge } from 'lodash';
import { app } from 'electron';

export class DBServiceMain implements IDBService {
  private db: LowSync<DBData>;

  constructor(db: LowSync<DBData>) {
    this.db = db;
  }

  setItem<Key extends keyof DBData>(key: Key, data: DBData[Key]) {
    this.db.data[key] = data;
    this.db.write();
  }

  getItem<Key extends keyof DBData>(key: Key) {
    return this.db.data[key];
  }
}

const defaultData: DBData = {
  rules: [],
  weekdays: [],
  settings: {
    locale: Locale.zhCN,
    volume: 100,
    muted: true,
    scaleMode: undefined,
    webScaleMode: WebScaleMode.Cover,
    wallpaperMode: WallpaperMode.Cover,
    autoCheckUpdate: true,
    openAtLogin: true,
    downloadsDir: join(app.getPath('downloads'), 'Workpaper'),
  },
  currentIndex: 0,
  websites: [],
};

if (platform() === 'darwin') {
  defaultData.settings.scaleMode = MacOSScaleMode.Auto;
} else if (platform() === 'win32') {
  defaultData.settings.scaleMode = WindowsScaleMode.Span;
}

const db = JSONSyncPreset(join(userDataDir, 'config.json'), defaultData);
const migratedData = merge(defaultData, db.data);
db.data = migratedData;
db.write();

export const configServiceMain = new DBServiceMain(db);
