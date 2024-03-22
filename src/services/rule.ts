import { Events } from '../../cross/enums';
import { timeToSeconds } from '../../cross/date';
import { ipcRenderer } from 'electron';
import { Rule } from '../../cross/interface';
import { configServiceRenderer } from '@/services/config-service';

export class RuleService {
  public static readonly RULE_KEY = 'rule';

  async save(rules: Rule[]) {
    await configServiceRenderer.setItem('rules', rules);
    ipcRenderer.invoke(Events.ResetSchedule);
  }

  async get() {
    return (await configServiceRenderer.getItem('rules')) || [];
  }

  async create(rule: Rule) {
    const rules = await this.get();
    rule.id = String(Date.now());
    rules.push(rule);
    return this.save(rules);
  }

  async update(rule: Rule) {
    const rules = await this.get();
    rules.forEach((item, index) => {
      if (item.id === rule.id) {
        rules[index] = rule;
      }
    });
    return this.save(rules);
  }

  async delete(id: string) {
    let rules = await this.get();
    rules = rules.filter((rule) => rule.id !== id);
    return this.save(rules);
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
