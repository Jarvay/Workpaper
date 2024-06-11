import { IMigration } from './index';
import { configServiceMain } from '../services/config.service';
import { Album, Rule } from '../../../cross/interface';
import { AlbumType, RuleType } from '../../../cross/enums';
import { isEqual, omit } from 'lodash';
import { generateId } from '../../../cross/utils';
import { DEFAULT_MARQUEE } from '../../../cross/consts';

export class Migration_20240509_1755 implements IMigration {
  id(): string {
    return 'Migration_20240509_1755';
  }

  async run() {
    const rules: (Rule & Record<string, any>)[] =
      configServiceMain.getItem('rules');
    const albums: Album[] = [];

    for (const rule of rules) {
      if (rule.type !== RuleType.Album) {
        rule.albumId = '';
        continue;
      }
      const album: Album = {
        type: AlbumType.Directory,
        wallpaperType: rule.wallpaperType,
        dir: rule.path,
        direction: rule.direction,
        paths: [],
        name: rule.path,
        id: await generateId(),
      };

      if (!albums.some((a) => isEqual(omit(a, 'id'), omit(album, 'id')))) {
        rule.albumId = album.id;
        albums.push(album);
      }
    }

    configServiceMain.setItem('albums', albums);
    configServiceMain.setItem('rules', rules);
  }
}
