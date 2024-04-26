export function randomByRange(min: number, max: number) {
  const range = max - min;
  const randNum = Math.random();
  return min + Math.round(randNum * range);
}
