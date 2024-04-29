import { Weekday } from '../../cross/interface';
import { BaseService } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class WeekdayService extends BaseService<'weekdays', Weekday> {
  async save(list: Weekday[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }

  getKeyInDB(): 'weekdays' {
    return 'weekdays';
  }
}

export const weekdayService = new WeekdayService();
