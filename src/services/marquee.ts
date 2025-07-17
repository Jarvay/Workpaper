import { Marquee } from '@/others/types.ts';
import { BaseService } from '@/services/base';
import { invoke } from '@tauri-apps/api/core';
import { Events } from '@/others/enums';

export class MarqueeService extends BaseService<'marquees', Marquee> {
  getKeyInDB(): 'marquees' {
    return 'marquees';
  }

  async save(list: Marquee[]): Promise<void> {
    await super.save(list);
    await invoke(Events.ResetSchedule);
  }
}

export const marqueeService = new MarqueeService();
