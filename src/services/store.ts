import { Store } from '@tauri-apps/plugin-store';

const defaultStore = await Store.load('config.json');

export const AppStore = {
  default() {
    return defaultStore;
  },
};
