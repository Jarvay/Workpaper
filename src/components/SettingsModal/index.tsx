import React, { useCallback, useState } from 'react';
import { Button, Card, Form, Modal, Select, Slider, Space, Switch } from 'antd';
import { ModalFormProps, Settings, TranslationFunc } from '@/others/types.ts';
import { cloneDeep, debounce } from 'lodash';
import { useMount, useUpdateEffect } from 'ahooks';
import { settingsService } from '@/services/settings';
import { Events, Locale, WallpaperMode } from '@/others/enums';
import { useTranslation } from 'react-i18next';
import ScaleModeComponent from '@/components/ScaleModeComponent';
import styles from './index.module.less';
import { invoke } from '@tauri-apps/api/core';
import {
  DEFAULT_NATIVE_SCALE_MODE,
  DEFAULT_WEB_SCALE_MODE,
} from '@/others/consts';
import ShortcutInput from '@/components/ShortcutInput';
import { Platform, platform as getPlatform } from '@tauri-apps/plugin-os';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { emit } from '@tauri-apps/api/event';

export type SettingsModalProps = ModalFormProps<Settings> & {};

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Settings>();
  const [platform, setPlatform] = useState<Platform>();
  const [isChanged, setIsChanged] = useState(false);

  const t = useTranslation().t as TranslationFunc;

  const checkIsChanged = useCallback(() => {
    if (!settings) return false;
    const currentSettings = form.getFieldsValue() as Settings;

    const COMPARE_KEYS: (keyof Settings)[] = [
      'wallpaperMode',
      'scaleMode',
      'webScaleMode',
      'pauseWhenBlur',
    ];

    const changed = COMPARE_KEYS.some((key) => {
      return currentSettings[key] !== settings[key];
    });

    setIsChanged(changed);
  }, [settings]);

  async function fetchSettings() {
    const s = await settingsService.get();
    setSettings(cloneDeep(s));
    form.resetFields();
    form.setFieldsValue(s);
  }

  useMount(async () => {
    setPlatform(getPlatform());
  });

  useUpdateEffect(() => {
    if (props.open) {
      settingsService.get().then(async (s) => {
        setSettings(cloneDeep(s));
        form.resetFields();
        form.setFieldsValue({
          ...s,
          startAtLogin: await isEnabled(),
        });
      });
    }
  }, [props.open]);

  return (
    <Modal
      {...(props.modalProps || {})}
      open={props.open}
      footer={[
        isChanged ? (
          <Button
            key="apply"
            type="primary"
            onClick={async () => {
              await invoke(Events.ResetSchedule);
              await fetchSettings();
              setIsChanged(false);
            }}
          >
            {t('apply')}
          </Button>
        ) : null,
        <Button key="close" onClick={props.modalProps?.onCancel}>
          {t('close')}
        </Button>,
      ]}
      destroyOnHidden
      title={t('settings')}
    >
      <Form
        form={form}
        labelCol={{ span: 6 }}
        labelWrap
        onValuesChange={async (_changedValues, values) => {
          await settingsService.save({
            ...settings,
            ...values,
          });
          await props.onChange?.({
            ...settings,
            ...values,
          } as Settings);
          checkIsChanged();
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Card className={styles.settingsCard}>
            <Form.Item label={t('language')} name="locale">
              <Select
                className={styles.formItem}
                options={[
                  { label: '简体中文', value: Locale.zhCN },
                  { label: 'English', value: Locale.enUS },
                ]}
                onChange={async (value) => {
                  await invoke(Events.UpdateTrayLocale, {
                    locale: value,
                  });
                }}
              />
            </Form.Item>

            <Form.Item label={t('startAtLogin')} name="startAtLogin">
              <Switch
                onChange={async (value) => {
                  if (value) {
                    await enable();
                  } else {
                    await disable();
                  }
                }}
              />
            </Form.Item>

            <Form.Item label={t('autoCheckUpdate')} name="autoCheckUpdate">
              <Switch />
            </Form.Item>
          </Card>

          <Card className={styles.settingsCard}>
            <Form.Item label={t('wallpaperMode')} name="wallpaperMode">
              <Select
                className={styles.formItem}
                options={[
                  {
                    label: t('wallpaperMode.cover'),
                    value: WallpaperMode.Window,
                  },
                  {
                    label: t('wallpaperMode.replace'),
                    value: WallpaperMode.Native,
                  },
                ]}
                onChange={async (value) => {
                  if (value === WallpaperMode.Native) {
                    if (platform) {
                      form.setFieldsValue({
                        scaleMode:
                          DEFAULT_NATIVE_SCALE_MODE[platform as string],
                      });
                    }
                  } else {
                    form.setFieldsValue({
                      webScaleMode: DEFAULT_WEB_SCALE_MODE,
                    });
                  }
                }}
              />
            </Form.Item>

            <Form.Item noStyle dependencies={['wallpaperMode']}>
              {({ getFieldsValue }) => {
                const { wallpaperMode } = getFieldsValue() as Settings;
                if (
                  wallpaperMode === WallpaperMode.Native &&
                  platform === 'linux'
                ) {
                  return null;
                }

                return (
                  <>
                    <ScaleModeComponent wallpaperMode={WallpaperMode.Native}>
                      {(scaleModeOptions) => {
                        return (
                          <Form.Item
                            hidden={wallpaperMode === WallpaperMode.Window}
                            label={t('scaleMode')}
                            name="scaleMode"
                          >
                            <Select
                              className={styles.formItem}
                              options={scaleModeOptions}
                            />
                          </Form.Item>
                        );
                      }}
                    </ScaleModeComponent>

                    <ScaleModeComponent wallpaperMode={WallpaperMode.Window}>
                      {(scaleModeOptions) => {
                        return (
                          <Form.Item
                            hidden={wallpaperMode === WallpaperMode.Native}
                            label={t('scaleMode')}
                            name="webScaleMode"
                          >
                            <Select
                              className={styles.formItem}
                              options={scaleModeOptions}
                            />
                          </Form.Item>
                        );
                      }}
                    </ScaleModeComponent>
                  </>
                );
              }}
            </Form.Item>
          </Card>

          <Card className={styles.settingsCard}>
            <Form.Item
              label={t('settings.pausePlayShortcut')}
              name="pausePlayShortcut"
            >
              <ShortcutInput />
            </Form.Item>

            <Form.Item label={t('settings.volume')} name="volume">
              <Slider
                min={0}
                max={100}
                onChange={debounce((volume) => {
                  emit(Events.SetLiveWallpaperVolume, volume);
                }, 200)}
              />
            </Form.Item>

            <Form.Item label={t('settings.mute')} name="mute">
              <Switch
                onChange={debounce((muted) => {
                  emit(Events.SetLiveWallpaperMuted, {
                    muted,
                  });
                }, 200)}
              />
            </Form.Item>
          </Card>
        </Space>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
