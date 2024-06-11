import { readdirSync } from 'fs';
import { join } from 'node:path';
import { IMAGE_EXT_LIST, VIDEO_EXT_LIST } from '../../../cross/consts';
import { Rule } from '../../../cross/interface';
import {
  AlbumType,
  ChangeType,
  WallpaperMode,
  WallpaperType,
} from '../../../cross/enums';
import {
  closeWallpaperWin,
  detachWallpaperWin,
  setLiveWallpaper,
  setMarqueeWallpaper,
  setStaticWallpaper,
} from './wallpaper-window';
import { gracefulShutdown, RecurrenceRule, scheduleJob } from 'node-schedule';
import { timeToSeconds } from '../../../cross/date';
import dayjs from 'dayjs';
import { configServiceMain } from './db-service';
import { SetOptions } from 'wallpaper';
import { screen } from 'electron';
import { platform } from 'os';
import { randomByRange } from '../../../cross/utils';

const timerMap: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

const typeExtMap = new Map([
  [
    WallpaperType.Image,
    IMAGE_EXT_LIST.filter((ext) => {
      return !(platform() === 'linux' && ext === 'heic');
    }),
  ],
  [WallpaperType.Video, VIDEO_EXT_LIST],
]);

function getAlbumById(albumId: string) {
  const albums = configServiceMain.getItem('albums');
  return albums.find((album) => album.id === albumId);
}

export async function setWallpaper(
  rule: Rule,
  filePath: string,
  displayId: number,
  currentIndex: number,
) {
  const album = getAlbumById(rule.albumId || '');

  switch (album?.wallpaperType) {
    default:
    case WallpaperType.Image:
      const { wallpaperMode, scaleMode } =
        configServiceMain.getItem('settings');
      const wallpaper = await import('wallpaper');
      if (wallpaperMode === WallpaperMode.Replace) {
        await wallpaper.setWallpaper(filePath, {
          scale: scaleMode as SetOptions['scale'],
          screen: 'all',
        });
        detachWallpaperWin();
      } else {
        const extList = typeExtMap.get(WallpaperType.Image) as string[];
        let paths: string[] = [];
        switch (rule.type) {
          case ChangeType.AutoChange:
            paths = readRuleFilePaths(rule, extList);
            break;
          case ChangeType.Fixed:
            paths = [filePath];
            break;
        }

        await setStaticWallpaper(
          {
            path: filePath,
            rule,
            paths,
            album,
          },
          displayId,
        );
      }
      configServiceMain.setItem('currentIndex', currentIndex);
      break;
    case WallpaperType.Video:
      await setLiveWallpaper([filePath], displayId);
      break;
    case WallpaperType.Marquee:
      await setMarqueeWallpaper(
        {
          album,
          rule,
        },
        displayId,
      );
      break;
  }
}

export async function updateWallpaper(rule: Rule, currentIndex: number) {
  const album = getAlbumById(rule.albumId || '');
  const wallpaperType = album?.wallpaperType || WallpaperType.Image;
  const extList = typeExtMap.get(wallpaperType) as string[];
  const paths = readRuleFilePaths(rule, extList);

  if (rule.type !== ChangeType.Fixed && rule.isRandom) {
    const max = paths.length - 1;
    currentIndex = randomByRange(0, max);
  }

  let filePath = paths[currentIndex];

  const displays = screen.getAllDisplays();
  for (const display of displays) {
    if (rule.type !== ChangeType.Fixed && rule.screenRandom) {
      const max = paths.length - 1;
      currentIndex = randomByRange(0, max);
      filePath = paths[currentIndex];
    }
    await setWallpaper(rule, filePath, display.id, currentIndex);
  }
}

function increaseImgIndex(currentIndex: number, rule: Rule) {
  const total = readRuleFilePaths(rule, IMAGE_EXT_LIST).length;

  if (currentIndex + 1 >= total) {
    return 0;
  }
  return currentIndex + 1;
}

function readRuleFilePaths(rule: Rule, extList: string[]) {
  const album = getAlbumById(rule.albumId || '');

  switch (album?.type) {
    default:
      return [];

    case AlbumType.Files:
      return album?.paths;
    case AlbumType.Directory:
      const filePaths = readdirSync(album?.dir) || [];
      return filePaths
        .filter((item) => !/(^|\/)\.[^\/.]/g.test(item))
        .filter((item) => extList.some((ext) => item.endsWith(ext)))
        .map((item) => {
          return join(album?.dir, item);
        });
  }
}

export async function createWallpaperTimer(rule: Rule) {
  let currentIndex = increaseImgIndex(
    configServiceMain.getItem('currentIndex'),
    rule,
  );
  await updateWallpaper(rule, currentIndex);
  return setInterval(
    async () => {
      currentIndex = increaseImgIndex(currentIndex, rule);
      await updateWallpaper(rule, currentIndex);
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

function getWeekdayById(id: string) {
  return configServiceMain.getItem('weekdays').find((item) => {
    return item.id === id;
  });
}

export async function resetSchedule() {
  await gracefulShutdown();
  closeWallpaperWin();

  for (const timerMapElement of timerMap) {
    const [, timer] = timerMapElement;
    clearInterval(timer);
  }
  timerMap.clear();

  const rules = configServiceMain.getItem('rules');

  rules.forEach((rule) => {
    const album = getAlbumById(rule.albumId || '');
    const wallpaperType = album?.wallpaperType || WallpaperType.Image;

    const [startHour, startMinute] = rule.start.split(':');
    const [endHour, endMinute] = rule.end.split(':');

    async function createIntervalPlan(dayOfWeek: number) {
      clearInterval(timerMap.get(rule.id as string));
      timerMap.set(rule.id as string, await createWallpaperTimer(rule));

      const stopRule = new RecurrenceRule();
      stopRule.second = 59;
      stopRule.minute = endMinute;
      stopRule.hour = endHour;
      stopRule.dayOfWeek = dayOfWeek;
      scheduleJob(stopRule, () => {
        clearInterval(timerMap.get(rule.id as string));
      });
    }

    const weekday = getWeekdayById(rule.weekdayId as string);
    const days = weekday?.days || [];
    days.forEach((day) => {
      const isCurrent = isCurrentRule(rule, day);

      const jobRule = new RecurrenceRule();
      jobRule.second = 0;
      jobRule.minute = startMinute;
      jobRule.hour = startHour;
      jobRule.dayOfWeek = day === 7 ? 0 : day;

      function setFixedWallpaper() {
        let index = 0;
        for (const display of screen.getAllDisplays()) {
          const path = rule.paths?.[index] || rule.paths?.[0];
          setWallpaper(rule, path, display.id, 0);
          index++;
        }
      }

      function setAutoChangeLiveWallpapers() {
        let index = 0;
        for (const display of screen.getAllDisplays()) {
          setLiveWallpaper(readRuleFilePaths(rule, VIDEO_EXT_LIST), display.id);
          index++;
        }
      }

      function setDisplaysMarqueeWallpaper() {
        const displays = screen.getAllDisplays();
        for (let i = 0; i < displays.length; i++) {
          const display = displays[i];
          setWallpaper(rule, '', display.id, 0);
        }
      }

      switch (rule.type) {
        default:
        case ChangeType.Fixed:
          if (isCurrent) {
            setFixedWallpaper();
          } else {
            scheduleJob(jobRule, () => {
              setFixedWallpaper();
            });
          }
          break;
        case ChangeType.AutoChange:
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
              setAutoChangeLiveWallpapers();
            } else {
              scheduleJob(jobRule, () => {
                setAutoChangeLiveWallpapers();
              });
            }
          }
          break;
        case ChangeType.Marquee:
          if (isCurrent) {
            setDisplaysMarqueeWallpaper();
          } else {
            scheduleJob(jobRule, () => {
              setDisplaysMarqueeWallpaper();
            });
          }
          break;
      }
    });
  });
}
