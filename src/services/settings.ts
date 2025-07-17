import i18next from 'i18next';
import { Settings } from '@/others/types.ts';
import { ConfigServiceRenderer } from '@/services/config-service';
import { isEqual } from 'lodash';

class SettingsService extends ConfigServiceRenderer<'settings'> {
  public static readonly SETTINGS_KEY = 'settings';

  async save(settings: Settings, oldSettings?: Settings) {
    if (!oldSettings) {
      oldSettings = await this.get();
    }
    if (oldSettings?.locale !== settings.locale) {
      await i18next.changeLanguage(settings.locale);
    }
    if (isEqual(settings, oldSettings)) {
      await this.setItem(SettingsService.SETTINGS_KEY, settings);
    } else {
      await this.setItem(SettingsService.SETTINGS_KEY, settings);
    }
  }

  async setSettingsItem<Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) {
    const settings = await this.get();
    settings[key] = value;
    await this.setItem(SettingsService.SETTINGS_KEY, settings);
  }

  async get() {
    return await this.getItem(SettingsService.SETTINGS_KEY);
  }
}

export const settingsService = new SettingsService();
