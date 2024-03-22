import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';
import { Weekday } from '../../cross/interface';
import { configServiceRenderer } from '@/services/config-service';
import { ruleService } from '@/services/rule';

export class WeekdayService {
  public static readonly WEEKDAY_KEY = 'weekday';

  save(weekdays: Weekday[]) {
    configServiceRenderer.setItem('weekdays', weekdays);
    ipcRenderer.invoke(Events.ResetSchedule);
  }

  get() {
    return configServiceRenderer.getItem('weekdays');
  }

  async create(weekday: Weekday) {
    const weekdays = await this.get();
    weekday.id = String(Date.now());
    weekdays.push(weekday);
    this.save(weekdays);
  }

  async update(weekday: Weekday) {
    const weekdays = await this.get();
    weekdays.forEach((item, index) => {
      if (item.id === weekday.id) {
        weekdays[index] = weekday;
      }
    });
    this.save(weekdays);
  }

  async delete(id: string) {
    let weekdays = await this.get();
    weekdays = weekdays.filter((weekday) => weekday.id !== id);

    const rules = await ruleService.get();
    for (const rule of rules) {
      if (rule.weekdayId === id) {
        await ruleService.delete(rule.id as string);
      }
    }

    this.save(weekdays);
  }
}

export const weekdayService = new WeekdayService();
