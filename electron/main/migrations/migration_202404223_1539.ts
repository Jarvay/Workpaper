import { IMigration } from './index';
import { configServiceMain } from '../services/db-service';
import { WallpaperDirection } from '../../../cross/enums';

export class Migration_202404223_1539 implements IMigration {
  run() {
    const rules = configServiceMain.getItem('rules');
    rules.forEach((rule) => {
      if (!rule.direction) {
        rule.direction = WallpaperDirection.Horizontal;
      }
    });
    configServiceMain.setItem('rules', rules);
  }
}
