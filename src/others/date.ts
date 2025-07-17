import dayjs from 'dayjs';

export function timeToSeconds(timeStr: string) {
  const day = '2001-01-01';
  const dateStart = dayjs(`${day} 00:00`);
  const timeDayjs = dayjs(`${day} ${timeStr}`);
  return timeDayjs.diff(dateStart, 'seconds');
}
