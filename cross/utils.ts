import { Md5 } from '@smithy/md5-js';

export function randomByRange(min: number, max: number) {
  const range = max - min;
  const randNum = Math.random();
  return min + Math.round(randNum * range);
}

export async function generateId() {
  const md5 = new Md5();
  const random = (Math.random() * 100000000).toFixed(0);
  md5.update(Date.now() + random);

  const uint8Array = await md5.digest();
  const strArr: string[] = [];
  uint8Array.forEach((x) => {
    strArr.push(('00' + x.toString(16)).slice(-2));
  });
  return strArr.join('');
}
