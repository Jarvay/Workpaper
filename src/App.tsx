import './styles/App.less';
import { ConfigProvider, FloatButton, Layout, Menu, MenuProps } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import {
  AppstoreOutlined,
  DownloadOutlined,
  InfoOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import SettingsModal from '@/components/SettingsModal';
import { useCallback, useRef, useState } from 'react';
import { Events, Locale } from '../cross/enums';
import { ConfigProviderProps } from 'antd/es/config-provider';
import { settingsService } from '@/services/settings';
import { useMount, useUnmount } from 'ahooks';
import { Settings } from '../cross/interface';
import { ipcRenderer } from 'electron';
import AboutModal from '@/components/AboutModal';
import { useTranslation } from 'react-i18next';
import DownloadDrawer, {
  DownloadDrawerActions,
} from '@/components/DownloadDrawer';
import { GlobalProvider } from '@/components/GlobalContext';

const LOCALE_MAP = new Map([
  [Locale.zhCN, zhCN],
  [Locale.enUS, enUS],
]);

const MENU_KEYS = {
  rules: 'rules',
  albums: 'albums',
  marquees: 'marquees',
  libs: 'libs',
  webpages: 'webpages',
};

const MENU_ROUTES = {
  [MENU_KEYS.rules]: '/',
  [MENU_KEYS.albums]: '/albums',
  [MENU_KEYS.marquees]: '/marquees',
  [MENU_KEYS.libs]: '/library',
  [MENU_KEYS.webpages]: '/webpages',
};

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [isWallpaperMode, setIsWallpaperMode] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();
  const [locale, setLocale] = useState<ConfigProviderProps['locale']>();
  const [selectedKeys, setSelectedKeys] = useState<MenuProps['selectedKeys']>();
  const [downloadDrawerOpen, setDownloadDrawerOpen] = useState(false);

  const downloadDrawerRef = useRef<DownloadDrawerActions>();

  const { t } = useTranslation();

  const menuItems: MenuProps['items'] = [
    {
      key: MENU_KEYS.rules,
      label: t('menu.rules'),
    },
    {
      key: MENU_KEYS.albums,
      label: t('menu.albums'),
    },
    {
      key: MENU_KEYS.marquees,
      label: t('menu.marquees'),
    },
    {
      key: MENU_KEYS.webpages,
      label: t('menu.webpages'),
    },
    {
      key: MENU_KEYS.libs,
      label: t('menu.libs'),
    },
  ];

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
      setIsWallpaperMode(true);
    } else {
      await checkUpdate();
    }
  });

  useUnmount(() => {
    ipcRenderer.off('update-can-available', onUpdateCanAvailable);
  });

  return (
    <GlobalProvider
      value={{
        downloadDrawerRef: downloadDrawerRef.current,
      }}
    >
      <ConfigProvider locale={locale} theme={{ cssVar: true }}>
        {!isWallpaperMode ? (
          <Layout style={{ width: '100%', height: '100%' }}>
            <Layout.Sider theme="light">
              <Menu
                theme="light"
                items={menuItems}
                defaultSelectedKeys={[MENU_KEYS.rules]}
                selectedKeys={selectedKeys}
                onClick={async (info) => {
                  setSelectedKeys([info.key]);
                  await router.navigate(MENU_ROUTES[info.key]);
                }}
              />
            </Layout.Sider>

            <Layout.Content>
              <RouterProvider router={router} />

              <FloatButton.Group
                trigger="hover"
                icon={<AppstoreOutlined />}
                badge={updateAvailable ? { dot: true } : undefined}
              >
                <FloatButton
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    setDownloadDrawerOpen(true);
                  }}
                />

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

              <SettingsModal
                open={settingsOpen}
                modalProps={{
                  onCancel: () => setSettingsOpen(false),
                }}
                onChange={(settings) => {
                  setLocale(
                    LOCALE_MAP.get(settings?.locale as Settings['locale']),
                  );
                }}
              />

              <AboutModal
                open={aboutModalOpen}
                modalProps={{
                  onCancel: () => setAboutModalOpen(false),
                }}
                versionInfo={versionInfo}
              />

              <DownloadDrawer
                open={downloadDrawerOpen}
                drawerProps={{
                  onClose: () => setDownloadDrawerOpen(false),
                }}
                ref={(ref) => {
                  if (ref) {
                    downloadDrawerRef.current = ref;
                  }
                }}
              />
            </Layout.Content>
          </Layout>
        ) : (
          <RouterProvider router={router} />
        )}
      </ConfigProvider>
    </GlobalProvider>
  );
}

export default App;
