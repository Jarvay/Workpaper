import { Album } from '../../cross/interface';
import { BaseService } from '@/services/base';
import { ipcRenderer } from 'electron';
import { Events } from '../../cross/enums';

export class AlbumService extends BaseService<'albums', Album> {
  getKeyInDB(): 'albums' {
    return 'albums';
  }

  async save(list: Album[]): Promise<void> {
    await super.save(list);
    await ipcRenderer.invoke(Events.ResetSchedule);
  }
}

export const albumService = new AlbumService();
