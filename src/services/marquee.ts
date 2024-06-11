import { Album, Marquee } from '../../cross/interface';
import { BaseService, UpsertType } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class MarqueeService extends BaseService<'marquees', Marquee> {
  getKeyInDB(): 'marquees' {
    return 'marquees';
  }

  async save(list: Marquee[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }
}

export const marqueeService = new MarqueeService();
