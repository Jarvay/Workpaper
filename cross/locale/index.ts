import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { zhCN } from './zh-cn';
import { settingsService } from '@/services/settings';
import { Locale } from '../enums';

async function initI18next() {
  i18n.use(initReactI18next).init({
    resources: {
      [Locale.enUS]: {
        translation: en,
      },
      [Locale.zhCN]: {
        translation: zhCN,
      },
    },
    lng: (await settingsService.get()).locale,
  });
}

initI18next();
