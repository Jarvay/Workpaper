import { Album } from '../../cross/interface';
import { BaseService, UpsertType } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events, WallpaperType } from '../../cross/enums';
import { ruleService } from '@/services/rule';

export class AlbumService extends BaseService<'albums', Album> {
  getKeyInDB(): 'albums' {
    return 'albums';
  }

  async save(list: Album[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }

  async beforeUpsert(item: Album, type: UpsertType): Promise<Album> {
    switch (item.wallpaperType) {
      case WallpaperType.Marquee:
        item.paths = [];
        item.dir = '';
        break;
      case WallpaperType.Video:
      case WallpaperType.Image:
        item.text = '';
        item.textColor = '';
        item.backgroundColor = '';
        break;
    }

    return item;
  }
}

export const albumService = new AlbumService();
