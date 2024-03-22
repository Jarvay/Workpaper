import { DBData, IDBService } from '../../cross/interface';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

class ConfigServiceRenderer implements IDBService {
  setItem<Key extends keyof DBData>(key: Key, data: DBData[Key]) {
    return ipcRenderer.invoke(Events.SetDBItem, key, data);
  }

  async getItem<Key extends keyof DBData>(key: Key): Promise<DBData[Key]> {
    return await ipcRenderer.invoke(Events.GetDBItem, key);
  }
}

export const configServiceRenderer = new ConfigServiceRenderer();
