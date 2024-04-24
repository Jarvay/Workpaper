import { Weekday } from '../../cross/interface';
import { BaseService } from '@/services/base';

export class WeekdayService extends BaseService<'weekdays', Weekday> {
  getKeyInDB(): 'weekdays' {
    return 'weekdays';
  }
}

export const weekdayService = new WeekdayService();
