import { Weekday } from '@/others/types.ts';
import { BaseService } from '@/services/base';
import { invoke } from '@tauri-apps/api/core';
import { Events } from '@/others/enums';

export class WeekdayService extends BaseService<'weekdays', Weekday> {
  async save(list: Weekday[]): Promise<void> {
    await super.save(list);
    await invoke(Events.ResetSchedule);
  }

  getKeyInDB(): 'weekdays' {
    return 'weekdays';
  }
}

export const weekdayService = new WeekdayService();
