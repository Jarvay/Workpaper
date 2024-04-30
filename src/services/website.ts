import { WallpaperWebsite } from '../../cross/interface';
import { BaseService } from '@/services/base';
import axios from 'axios';
import { message } from 'antd';
import { t } from 'i18next';

export class WebsiteService extends BaseService<'websites', WallpaperWebsite> {
  static readonly SUB_URLS = [
    'https://fastly.jsdelivr.net/gh/Jarvay/workpaper-sub@main/websites.json',
    'https://github.com/Jarvay/workpaper-sub/raw/main/websites.json',
    'https://cdn.jsdelivr.net/gh/Jarvay/workpaper-sub@main/websites.json',
    'https://ghproxy.net/https://raw.githubusercontent.com/Jarvay/workpaper-sub/main/websites.json',
    'https://gh-proxy.net/https://raw.githubusercontent.com/Jarvay/workpaper-sub/main/websites.json',
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
      for (let itemInSub of data) {
        for (const it of olds) {
          if (it.name === itemInSub.name && it.type === itemInSub.type) {
            await this.update({
              ...it,
              ...itemInSub,
            });
          }
        }
      }

      for (const itemInSub of data) {
        const exists = olds.some(
          (it) => it.name === itemInSub.name && it.type === itemInSub.type,
        );
        if (!exists) {
          await this.create(itemInSub);
        }
      }
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
