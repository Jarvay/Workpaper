import React, { useContext } from 'react';
import { DownloadDrawerActions } from '@/components/DownloadDrawer';

export interface GlobalContextValue {
  downloadDrawerRef?: DownloadDrawerActions;
}

const GlobalContext = React.createContext<GlobalContextValue>({});

export const GlobalProvider = GlobalContext.Provider;

export function useGlobalContext() {
  return useContext(GlobalContext);
}
