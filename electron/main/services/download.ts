import {
  BrowserWindow,
  ipcMain,
  WebContents,
  DownloadItem,
  Event,
} from 'electron';
import axios from 'axios';
import mime from 'mime';
import { createHash } from 'crypto';
import { join } from 'node:path';
import { configServiceMain } from './db-service';
import { Events } from '../../../cross/enums';
import { DownloadArg, DownloadEvent } from '../../../cross/interface';
import { omit } from 'lodash';

const downloadingMD5Set = new Set<string>();
const downloadEventMap = new Map<string, Omit<DownloadEvent, 'event'>>();

export function handleDownload(win?: BrowserWindow | null) {
  const willDownloadListener: (
    event: Event,
    item: DownloadItem,
    webContents: WebContents,
  ) => void = async (event, item, webContents) => {
    const downloadEvent = downloadEventMap.get(item.getURL());
    if (!downloadEvent) {
      return;
    }
    item.setSavePath(downloadEvent.path);
    webContents.send(Events.OnDownloadUpdated, downloadEvent);
    item.on('updated', (event, state) => {
      if (!win || webContents.isDestroyed()) return;
      if (state === 'progressing') {
        const percent = String(
          100 * (item.getReceivedBytes() / item.getTotalBytes()),
        );
        webContents.send(Events.OnDownloadUpdated, {
          ...downloadEvent,
          event: 'progress',
          progress: parseFloat(parseFloat(percent).toFixed(2)),
        } as DownloadEvent);
      }
    });
  };

  win?.webContents.session.on('will-download', willDownloadListener);

  ipcMain.on(Events.Download, async (event, { url, thumb }: DownloadArg) => {
    if (!win || !url) return;

    const { headers } = await axios.head(url);
    const ext = mime.getExtension(headers['content-type']);
    const hash = createHash('md5');
    hash.update(url);
    const md5 = hash.digest('hex');
    if (downloadingMD5Set.has(md5)) {
      return;
    }

    const filename = `${md5}.${ext}`;
    const { downloadsDir } = configServiceMain.getItem('settings');
    const path = join(downloadsDir, filename);
    downloadingMD5Set.add(md5);
    const downloadEvent: DownloadEvent = {
      url,
      thumb,
      md5,
      filename,
      path,
      event: 'start',
      progress: 0,
    };

    win.webContents.send(Events.OnDownloadUpdated, downloadEvent);
    downloadEventMap.set(url, omit(downloadEvent, 'event'));

    win.webContents.downloadURL(url);
  });
}
