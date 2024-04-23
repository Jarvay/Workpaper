import { TranslationFunc, WallpaperWebsite } from '../../cross/interface';
import { BaseService } from '@/services/base';
import axios from 'axios';
import { message } from 'antd';
import { t as _t } from 'i18next';

const t = _t as TranslationFunc;

export class WebsiteService extends BaseService<'websites', WallpaperWebsite> {
  static readonly SUB_URLS = [
    'https://github.com/Jarvay/workpaper-sub/raw/main/websites.json',
    'https://cdn.jsdelivr.net/gh/Jarvay/workpaper-sub@main/websites.json',
  ];

  getKeyInDB(): 'websites' {
    return 'websites';
  }

  async sync(index = 0) {
    try {
      const { data }: { data: WallpaperWebsite[] } = await axios.get(
        WebsiteService.SUB_URLS[index],
      );
      const olds = await this.get();
      olds.forEach((item) => {
        data.forEach((it) => {
          if (it.name === item.name && it.type === item.type) {
            item = {
              ...item,
              ...it,
            };
          } else {
            this.create(it);
          }
        });
      });

      await this.save(olds);
    } catch (e) {
      if (index + 1 >= WebsiteService.SUB_URLS.length) {
        message.error(t('lib.syncFailed'));
        return;
      }
      await this.sync(index + 1);
    }
  }
}

export const websiteService = new WebsiteService();
