import { Album } from '@/others/types.ts';
import { BaseService } from '@/services/base';
import { invoke } from '@tauri-apps/api/core';
import { Events } from '@/others/enums';

export class AlbumService extends BaseService<'albums', Album> {
  getKeyInDB(): 'albums' {
    return 'albums';
  }

  async save(list: Album[]): Promise<void> {
    await super.save(list);
    await invoke(Events.ResetSchedule);
  }
}

export const albumService = new AlbumService();
