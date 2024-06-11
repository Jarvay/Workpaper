import {
  BeanWithId,
  ConfigData,
  DBTableKey,
  IDBService,
} from '../../cross/interface';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class ConfigServiceRenderer<Key extends keyof ConfigData>
  implements IDBService<ConfigData>
{
  setItem<Key extends keyof ConfigData>(key: Key, data: ConfigData[Key]) {
    return ipcRenderer.invoke(Events.SetDBItem, key, data);
  }

  async getItem<Key extends keyof ConfigData>(
    key: Key,
  ): Promise<ConfigData[Key]> {
    return await ipcRenderer.invoke(Events.GetDBItem, key);
  }
}

export class TableServiceRenderer<
  Key extends DBTableKey,
  T extends BeanWithId,
> {
  setRows(key: Key, data: T[]) {
    return ipcRenderer.invoke(Events.SetDBItem, key, data);
  }

  async getRows(key: Key): Promise<T[]> {
    return await ipcRenderer.invoke(Events.GetDBItem, key);
  }
}

export const configServiceRenderer = new ConfigServiceRenderer();
