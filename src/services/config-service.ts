import {
  BeanWithId,
  DBData,
  DBTableKey,
  IDBService,
} from '../../cross/interface';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class ConfigServiceRenderer<Key extends keyof DBData>
  implements IDBService
{
  setItem<Key extends keyof DBData>(key: Key, data: DBData[Key]) {
    return ipcRenderer.invoke(Events.SetDBItem, key, data);
  }

  async getItem<Key extends keyof DBData>(key: Key): Promise<DBData[Key]> {
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
