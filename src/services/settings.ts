import i18next from 'i18next';
import { Events } from '../../cross/enums';
import { ipcRenderer } from 'electron';
import { Settings } from '../../cross/interface';
import { configServiceRenderer } from '@/services/config-service';
import { isEqual } from 'lodash';

class SettingsService {
  public static readonly SETTINGS_KEY = 'settings';

  async save(settings: Settings, oldSettings?: Settings) {
    if (!oldSettings) {
      oldSettings = await this.get();
    }
    if (oldSettings?.locale !== settings.locale) {
      await i18next.changeLanguage(settings.locale);
    }
    if (isEqual(settings, oldSettings)) {
      await ipcRenderer.invoke(Events.InitSettings, settings);
    } else {
      await ipcRenderer.invoke(Events.SettingsChange, settings);
    }
  }

  async get() {
    return await configServiceRenderer.getItem('settings');
  }
}

export const settingsService = new SettingsService();
