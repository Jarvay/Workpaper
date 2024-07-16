import { Webpage } from '../../cross/interface';
import { BaseService } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class WebpageService extends BaseService<'webpages', Webpage> {
  getKeyInDB(): 'webpages' {
    return 'webpages';
  }

  async save(list: Webpage[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }
}

export const webpageService = new WebpageService();
