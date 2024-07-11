import { BrowserWindow } from 'electron';

export type BrowserWindowId = BrowserWindow['id'];
export type WinState = {
  manualPause: boolean;
};
