import { timeToSeconds } from '@/others/date';
import { Rule } from '@/others/types.ts';
import { BaseService } from '@/services/base';
import { invoke } from '@tauri-apps/api/core';
import { Events, RuleType } from '@/others/enums';

export class RuleService extends BaseService<'rules', Rule> {
  getKeyInDB(): 'rules' {
    return 'rules';
  }

  async save(list: Rule[]): Promise<void> {
    await super.save(list);
    await invoke(Events.ResetSchedule);
  }

  async beforeUpsert(item: Rule): Promise<Rule> {
    if (item.type === RuleType.Fixed) {
      item.isRandom = false;
      item.screenRandom = false;
    }

    return item;
  }

  async beforeCreate(item: Rule): Promise<Rule> {
    return await this.beforeUpsert(item);
  }

  async beforeUpdate(item: Rule): Promise<Rule> {
    return await this.beforeUpsert(item);
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
