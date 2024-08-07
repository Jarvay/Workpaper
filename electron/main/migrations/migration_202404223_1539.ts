import { IMigration } from './index';
import { configServiceMain } from '../services/config.service';
import { WallpaperDirection } from '../../../cross/enums';

export class Migration_202404223_1539 implements IMigration {
  id(): string {
    return 'Migration_202404223_1539';
  }
  run() {
    const rules = configServiceMain.getItem('rules');
    rules.forEach((rule) => {
      // @ts-ignore
      if (!rule.direction) {
        // @ts-ignore
        rule.direction = WallpaperDirection.Horizontal;
      }
    });
    configServiceMain.setItem('rules', rules);
  }
}
