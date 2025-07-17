import { Webpage } from '@/others/types.ts';
import { BaseService } from '@/services/base';
import { invoke } from '@tauri-apps/api/core';
import { Events } from '@/others/enums';

export class WebpageService extends BaseService<'webpages', Webpage> {
  getKeyInDB(): 'webpages' {
    return 'webpages';
  }

  async save(list: Webpage[]): Promise<void> {
    await super.save(list);
    await invoke(Events.ResetSchedule);
  }
}

export const webpageService = new WebpageService();
