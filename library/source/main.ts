import bindings from 'bindings';

const workpaperLibrary = bindings('workpaper-library');

export function isWindowCompletedCovered(hwnd: number) {
  return workpaperLibrary.isWindowCompletedCovered(hwnd);
}
