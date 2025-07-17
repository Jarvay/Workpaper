import React, { useContext } from 'react';
import { DownloadDrawerActions } from '@/components/DownloadDrawer';
import { MessageInstance } from 'antd/es/message/interface';
import { message } from 'antd';
import { Settings } from '@/others/types.ts';

export type GlobalContextValue = {
  downloadDrawerRef?: DownloadDrawerActions;
  messageApi: MessageInstance;
  settings?: Settings;
};

const GlobalContext = React.createContext<GlobalContextValue>({
  messageApi: message,
});

export const GlobalProvider = GlobalContext.Provider;

export function useGlobalContext() {
  return useContext(GlobalContext);
}

export function useMessageApi() {
  return useContext(GlobalContext).messageApi;
}

export function useSettings() {
  return useContext(GlobalContext).settings;
}
