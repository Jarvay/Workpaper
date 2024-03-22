import './App.css';
import { ConfigProvider, FloatButton } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { SettingOutlined } from '@ant-design/icons';
import SettingsModal from '@/components/SettingsModal';
import { useCallback, useState } from 'react';
import { Locale } from '../cross/enums';
import { ConfigProviderProps } from 'antd/es/config-provider';
import { settingsService } from '@/services/settings';
import { useMount, useUnmount } from 'ahooks';
import { emitter } from '@/services/emitter';
import { Settings } from '../cross/interface';
import { ipcRenderer } from 'electron';

const LOCALE_MAP = new Map([
  [Locale.zhCN, zhCN],
  [Locale.enUS, enUS],
]);

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsBtnShow, setSettingsBtnShow] = useState<boolean>(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();

  const [locale, setLocale] = useState<ConfigProviderProps['locale']>();

  const onUpdateCanAvailable = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
      if (arg1.update) {
        setUpdateAvailable(true);
        setVersionInfo(arg1);
      }
    },
    [],
  );

  useMount(async () => {
    emitter.on('setSettingsBtnShow', (visible: boolean) => {
      setSettingsBtnShow(visible);
    });

    const settings = await settingsService.get();
    setLocale(LOCALE_MAP.get(settings.locale));

    if (window.location.hash.includes('/wallpaper')) {
      ipcRenderer.on('update-can-available', onUpdateCanAvailable);
      if (settings.autoCheckUpdate) {
        try {
          await ipcRenderer.invoke('check-update');
        } catch (e) {
          console.warn(e);
        }
      }
    }
  });

  useUnmount(() => {
    ipcRenderer.off('update-can-available', onUpdateCanAvailable);
  });

  return (
    <ConfigProvider locale={locale}>
      <RouterProvider router={router} />

      <>
        {settingsBtnShow && (
          <FloatButton
            icon={<SettingOutlined />}
            badge={updateAvailable ? { dot: true } : undefined}
            onClick={() => {
              setSettingsOpen(true);
            }}
          />
        )}

        <SettingsModal
          open={settingsOpen}
          onCancel={() => setSettingsOpen(false)}
          onChange={(settings) => {
            setLocale(LOCALE_MAP.get(settings?.locale as Settings['locale']));
          }}
          versionInfo={versionInfo}
        />
      </>
    </ConfigProvider>
  );
}

export default App;
