import { BrowserWindow } from 'electron';

export type BrowserWindowId = BrowserWindow['id'];
export interface WinState {
  manualPause: boolean;
}
