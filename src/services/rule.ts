import { timeToSeconds } from '../../cross/date';
import { Rule } from '../../cross/interface';
import { BaseService } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class RuleService extends BaseService<'rules', Rule> {
  getKeyInDB(): 'rules' {
    return 'rules';
  }

  async save(list: Rule[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }

  async isConflicts(
    start: string,
    end: string,
    weekdayId: string,
    id?: string,
  ) {
    const startSec = timeToSeconds(start);
    const endSec = timeToSeconds(end);

    const rules = await this.get();
    return rules
      .filter((rule) => (id ? rule.id !== id : true))
      .filter((rule) => rule.weekdayId === weekdayId)
      .some((rule) => {
        const ruleStart = timeToSeconds(rule.start);
        const ruleEnd = timeToSeconds(rule.end);

        if (ruleStart <= startSec && ruleEnd >= startSec) {
          return true;
        } else if (ruleStart <= endSec && ruleEnd >= endSec) {
          return true;
        }

        return false;
      });
  }
}

export const ruleService = new RuleService();
