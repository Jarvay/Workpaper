import { BeanWithId, ConfigData, DBTableKey } from '../../../cross/interface';
import { DBServiceMain } from './db.service';
import {
  Locale,
  MacOSScaleMode,
  WallpaperMode,
  WebScaleMode,
  WindowsScaleMode,
} from '../../../cross/enums';
import { join } from 'node:path';
import { app } from 'electron';
import { platform } from 'os';
import { JSONSyncPreset } from 'lowdb/node';
import { userDataDir } from './utils';
import { merge } from 'lodash';

export class Table<T extends BeanWithId> {
  private configService: DBServiceMain<ConfigData>;

  private readonly tableKey: DBTableKey;

  constructor(key: DBTableKey, configService: DBServiceMain<ConfigData>) {
    this.tableKey = key;
    this.configService = configService;
  }

  findById(id: string | number) {
    const item = this.configService.getItem(this.tableKey) as unknown as T[];
    return item.find((item) => item.id === id);
  }
}

export class ConfigServiceMain extends DBServiceMain<ConfigData> {
  private tableMap: Map<DBTableKey, Table<any>> = new Map();

  table<T extends BeanWithId>(key: DBTableKey) {
    let t = this.tableMap.get(key) as Table<T>;
    if (!t) {
      t = new Table<T>(key, this);
      this.tableMap.set(key, t);
    }
    return t;
  }
}

const defaultData: ConfigData = {
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
    pauseWhenBlur: true,
    pausePlayShortcut: 'Ctrl+Alt+P',
  },
  websites: [],
  migrations: [],
  albums: [],
  marquees: [],
};

if (platform() === 'darwin') {
  defaultData.settings.scaleMode = MacOSScaleMode.Auto;
  defaultData.settings.pausePlayShortcut = 'Control+Alt+P';
} else if (platform() === 'win32') {
  defaultData.settings.scaleMode = WindowsScaleMode.Span;
  defaultData.settings.pausePlayShortcut = 'Ctrl+Alt+P';
}

const db = JSONSyncPreset(join(userDataDir, 'config.json'), defaultData);
const migratedData = merge(defaultData, db.data);
db.data = migratedData;
db.write();

export const configServiceMain = new ConfigServiceMain(db);
