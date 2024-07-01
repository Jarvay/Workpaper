import i18n from 'i18next';
import { Locale } from '../../cross/enums';
import { en } from '../../cross/locale/en';
import { zhCN } from '../../cross/locale/zh-cn';
import { configServiceMain } from './services/config.service';

i18n.init({
  resources: {
    [Locale.enUS]: {
      translation: en,
    },
    [Locale.zhCN]: {
      translation: zhCN,
    },
  },
  lng: configServiceMain.getItem('settings')?.locale || Locale.zhCN,
});
