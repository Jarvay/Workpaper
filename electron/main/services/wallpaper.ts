import { readdirSync } from 'fs';
import { join } from 'node:path';
import { IMAGE_EXT_LIST, VIDEO_EXT_LIST } from '../../../cross/consts';
import {
  Album,
  Marquee,
  Rule,
  Webpage,
  Weekday,
} from '../../../cross/interface';
import {
  AlbumType,
  RuleType,
  WallpaperMode,
  WallpaperType,
} from '../../../cross/enums';
import { WallpaperWindowService } from './wallpaper-window';
import { gracefulShutdown, RecurrenceRule, scheduleJob } from 'node-schedule';
import { timeToSeconds } from '../../../cross/date';
import dayjs from 'dayjs';
import { tmpDataServiceMain } from './db.service';
import { screen } from 'electron';
import { platform } from 'os';
import { randomByRange } from '../../../cross/utils';
import { configServiceMain } from './config.service';

const timerMap: Map<string, NodeJS.Timeout | undefined> = new Map<
  string,
  NodeJS.Timeout | undefined
>();

const typeExtMap = new Map([
  [
    WallpaperType.Image,
    IMAGE_EXT_LIST.filter((ext) => {
      return !(platform() === 'linux' && ext === 'heic');
    }),
  ],
  [WallpaperType.Video, VIDEO_EXT_LIST],
]);

WallpaperWindowService.init({
  resetSchedule,
  removeSchedule,
});

const wallpaperWinService = WallpaperWindowService.instance;

function updateCurrentIndex(index: number, isRandom?: boolean) {
  if (isRandom === false) {
    tmpDataServiceMain.setItem('currentIndex', index);
  }
}

async function setFixedWallpaper(
  rule: Rule,
  filePath: string,
  displayId: number,
) {
  switch (rule.wallpaperType) {
    default:
    case WallpaperType.Image:
      const { wallpaperMode, scaleMode } =
        configServiceMain.getItem('settings');
      const wallpaper = await import('wallpaper');
      if (wallpaperMode === WallpaperMode.Replace) {
        await wallpaper.setWallpaper(filePath, {
          scale: scaleMode as any,
          screen: 'all',
        });
        wallpaperWinService.detachWallpaperWin();
      } else {
        let paths: string[] = [filePath];

        await wallpaperWinService.setStaticWallpaper(
          {
            path: filePath,
            rule,
            paths,
            album: {} as Album,
          },
          displayId,
        );
      }
      break;
    case WallpaperType.Video:
      await wallpaperWinService.setLiveWallpaper(
        {
          paths: [filePath],
          rule,
        },
        displayId,
      );
      break;
  }
}

export async function updateStaticWallpaper(rule: Rule, album: Album) {
  const wallpaperType = album.wallpaperType;
  const extList = typeExtMap.get(wallpaperType) as string[];
  const paths = readAlbumFilePaths(album, extList);

  let currentIndex = increaseImgIndex(
    tmpDataServiceMain.getItem('currentIndex'),
    album,
  );

  if (rule.isRandom) {
    const max = paths.length - 1;
    currentIndex = randomByRange(0, max);
  }

  let filePath = paths[currentIndex];

  const displays = screen.getAllDisplays();
  for (const display of displays) {
    if (rule.screenRandom) {
      const max = paths.length - 1;
      currentIndex = randomByRange(0, max);
      filePath = paths[currentIndex];
    }
    const { wallpaperMode, scaleMode } = configServiceMain.getItem('settings');
    const wallpaper = await import('wallpaper');
    if (wallpaperMode === WallpaperMode.Replace) {
      await wallpaper.setWallpaper(filePath, {
        scale: scaleMode as any,
        screen: 'all',
      });
      wallpaperWinService.detachWallpaperWin();
    } else {
      const extList = typeExtMap.get(WallpaperType.Image) as string[];
      let paths: string[] = readAlbumFilePaths(album, extList);

      await wallpaperWinService.setStaticWallpaper(
        {
          path: filePath,
          rule,
          paths,
          album,
        },
        display.id,
      );
    }
    updateCurrentIndex(currentIndex, rule.isRandom);
  }
}

function increaseImgIndex(currentIndex: number, album: Album) {
  const total = readAlbumFilePaths(album, IMAGE_EXT_LIST).length;

  if (currentIndex + 1 >= total) {
    return 0;
  }
  return currentIndex + 1;
}

function readAlbumFilePaths(album: Album, extList: string[]) {
  switch (album.type) {
    default:
      return [];

    case AlbumType.Files:
      return album.paths.map((item) => item.path) || [];
    case AlbumType.Directory:
      const filePaths = readdirSync(album.dir) || [];
      return filePaths
        .filter((item) => !/(^|\/)\.[^\/.]/g.test(item))
        .filter((item) => extList.some((ext) => item.endsWith(ext)))
        .map((item) => {
          return join(album.dir, item);
        });
  }
}

export async function createStaticWallpaperTimer(rule: Rule) {
  const album = configServiceMain.table<Album>('albums').findById(rule.albumId);
  if (!album) return undefined;

  await updateStaticWallpaper(rule, album);
  return setInterval(
    async () => {
      await updateStaticWallpaper(rule, album);
    },
    (rule.interval || 60) * 1000,
  );
}

function isCurrentRule(rule: Rule, day: number) {
  let dayOfWeek = new Date().getDay();
  dayOfWeek = dayOfWeek || 7;
  if (dayOfWeek !== day) {
    return false;
  }

  const now = timeToSeconds(dayjs().format('HH:mm'));
  const start = timeToSeconds(rule.start);
  const end = timeToSeconds(rule.end);
  return start <= now && end >= now;
}

export async function removeSchedule() {
  await gracefulShutdown();
  wallpaperWinService.closeWallpaperWin();

  for (const timerMapElement of timerMap) {
    const [, timer] = timerMapElement;
    clearInterval(timer);
  }
  timerMap.clear();

  wallpaperWinService.windowsMap.clear();
}

export async function resetSchedule() {
  await removeSchedule();

  const rules = configServiceMain.getItem('rules');

  rules.forEach((rule) => {
    const [startHour, startMinute] = rule.start.split(':');
    const [endHour, endMinute] = rule.end.split(':');

    async function createIntervalPlan(dayOfWeek: number) {
      clearInterval(timerMap.get(rule.id));
      timerMap.set(rule.id, await createStaticWallpaperTimer(rule));

      const stopRule = new RecurrenceRule();
      stopRule.second = 59;
      stopRule.minute = endMinute;
      stopRule.hour = endHour;
      stopRule.dayOfWeek = dayOfWeek;
      scheduleJob(stopRule, () => {
        clearInterval(timerMap.get(rule.id));
      });
    }

    const weekday = configServiceMain
      .table<Weekday>('weekdays')
      .findById(rule.weekdayId);
    const days = weekday?.days || [];
    days.forEach((day) => {
      const isCurrent = isCurrentRule(rule, day);

      const jobRule = new RecurrenceRule();
      jobRule.second = 0;
      jobRule.minute = startMinute;
      jobRule.hour = startHour;
      jobRule.dayOfWeek = day === 7 ? 0 : day;

      function setDisplaysFixedWallpaper() {
        let index = 0;
        for (const display of screen.getAllDisplays()) {
          const path = rule.paths[index] || rule.paths[0];
          setFixedWallpaper(rule, path, display.id);
          index++;
        }
      }

      function setDisplaysLiveWallpaper(album: Album) {
        let index = 0;
        for (const display of screen.getAllDisplays()) {
          wallpaperWinService.setLiveWallpaper(
            {
              paths: readAlbumFilePaths(album, VIDEO_EXT_LIST),
              rule,
            },
            display.id,
          );
          index++;
        }
      }

      async function setDisplaysMarqueeWallpaper() {
        const marquee = configServiceMain
          .table<Marquee>('marquees')
          .findById(rule.marqueeId);

        const displays = screen.getAllDisplays();
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];

          await wallpaperWinService.setMarqueeWallpaper(
            { marquee: marquee as Marquee, rule },
            display.id,
          );
        }
      }

      async function setDisplaysWebpageWallpaper() {
        const webpage = configServiceMain
          .table<Webpage>('webpages')
          .findById(rule.webpageId);

        const displays = screen.getAllDisplays();
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];

          await wallpaperWinService.setWebpageWallpaper(
            { webpage: webpage as Webpage },
            display.id,
          );
        }
      }

      switch (rule.type) {
        default:
        case RuleType.Fixed:
          if (isCurrent) {
            setDisplaysFixedWallpaper();
          } else {
            scheduleJob(jobRule, () => {
              setDisplaysFixedWallpaper();
            });
          }
          break;
        case RuleType.Album:
          const album = configServiceMain
            .table<Album>('albums')
            .findById(rule.albumId);
          if (!album) return;

          const wallpaperType = album.wallpaperType;
          if (wallpaperType === WallpaperType.Image) {
            if (isCurrent) {
              createIntervalPlan(day);
            } else {
              scheduleJob(jobRule, () => {
                createIntervalPlan(day);
              });
            }
          } else if (wallpaperType === WallpaperType.Video) {
            if (isCurrent) {
              setDisplaysLiveWallpaper(album);
            } else {
              scheduleJob(jobRule, () => {
                setDisplaysLiveWallpaper(album);
              });
            }
          }
          break;
        case RuleType.Marquee:
          if (isCurrent) {
            setDisplaysMarqueeWallpaper();
          } else {
            scheduleJob(jobRule, () => {
              setDisplaysMarqueeWallpaper();
            });
          }
          break;
        case RuleType.Webpage:
          if (isCurrent) {
            setDisplaysWebpageWallpaper();
          } else {
            scheduleJob(jobRule, () => {
              setDisplaysWebpageWallpaper();
            });
          }
          break;
      }
    });
  });
}
