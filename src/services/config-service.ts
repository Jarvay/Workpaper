import { ConfigData } from '@/others/types.ts';
import { AppStore } from '@/services/store.ts';

export class ConfigServiceRenderer<Key extends keyof ConfigData> {
  setItem(key: Key, data: ConfigData[Key]) {
    return AppStore.default().set(key, data);
  }

  getItem(key: Key): Promise<ConfigData[Key]> {
    return AppStore.default().get(key) as Promise<ConfigData[Key]>;
  }
}
