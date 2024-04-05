import './App.css';
import { ConfigProvider, FloatButton } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import {
  AppstoreOutlined,
  InfoOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import SettingsModal from '@/components/SettingsModal';
import { useCallback, useState } from 'react';
import { Events, Locale } from '../cross/enums';
import { ConfigProviderProps } from 'antd/es/config-provider';
import { settingsService } from '@/services/settings';
import { useMount, useUnmount } from 'ahooks';
import { emitter } from '@/services/emitter';
import { Settings } from '../cross/interface';
import { ipcRenderer } from 'electron';
import AboutModal from '@/components/AboutModal';

const LOCALE_MAP = new Map([
  [Locale.zhCN, zhCN],
  [Locale.enUS, enUS],
]);

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [settingsBtnShow, setSettingsBtnShow] = useState<boolean>(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();

  const [locale, setLocale] = useState<ConfigProviderProps['locale']>();

  async function checkUpdate() {
    const isPackaged = await ipcRenderer.invoke(Events.IsPackaged);
    if (!isPackaged) return;

    ipcRenderer.on('update-can-available', onUpdateCanAvailable);

    const settings = await settingsService.get();
    if (settings.autoCheckUpdate) {
      try {
        await ipcRenderer.invoke('check-update');
      } catch (e) {
        setTimeout(
          async () => {
            await checkUpdate();
          },
          60 * 5 * 1000,
        );
      }
    }
  }

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
    const settings = await settingsService.get();
    setLocale(LOCALE_MAP.get(settings.locale));

    if (window.location.hash.startsWith('#/wallpaper')) {
      setSettingsBtnShow(false);
    } else {
      checkUpdate();
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
          <FloatButton.Group
            trigger="hover"
            icon={<AppstoreOutlined />}
            badge={updateAvailable ? { dot: true } : undefined}
          >
            <FloatButton
              icon={<InfoOutlined />}
              badge={updateAvailable ? { dot: true } : undefined}
              onClick={() => {
                setAboutModalOpen(true);
              }}
            />

            <FloatButton
              icon={<SettingOutlined />}
              onClick={() => {
                setSettingsOpen(true);
              }}
            />
          </FloatButton.Group>
        )}

        <SettingsModal
          open={settingsOpen}
          onCancel={() => setSettingsOpen(false)}
          onChange={(settings) => {
            setLocale(LOCALE_MAP.get(settings?.locale as Settings['locale']));
          }}
        />

        <AboutModal
          open={aboutModalOpen}
          onCancel={() => setAboutModalOpen(false)}
          versionInfo={versionInfo}
        />
      </>
    </ConfigProvider>
  );
}

export default App;
