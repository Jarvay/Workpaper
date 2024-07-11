import React, { useCallback, useState } from 'react';
import { Button, Form, Input, Modal, Select, Slider, Switch } from 'antd';
import { ModalFormProps, Settings } from '../../../cross/interface';
import { cloneDeep, debounce } from 'lodash';
import { useMount, useUpdateEffect } from 'ahooks';
import { settingsService } from '@/services/settings';
import { Events, Locale, ScaleType, WallpaperMode } from '../../../cross/enums';
import { useTranslation } from 'react-i18next';
import ScaleModeComponent from '@/components/ScaleModeComponent';
import styles from './index.module.less';
import { ipcRenderer } from 'electron';
import {
  DEFAULT_NATIVE_SCALE_MODE,
  DEFAULT_WEB_SCALE_MODE,
} from '../../../cross/consts';
import ShortcutInput from '@/components/ShortcutInput';

export type SettingsModalProps = ModalFormProps<Settings> & {};

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Settings>();
  const [platform, setPlatform] = useState<NodeJS.Platform>();
  const [isChanged, setIsChanged] = useState(false);

  const { t } = useTranslation();

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
    setPlatform(await ipcRenderer.invoke(Events.GetPlatform));
  });

  useUpdateEffect(() => {
    if (props.open) {
      settingsService.get().then((s) => {
        setSettings(cloneDeep(s));
        form.resetFields();
        form.setFieldsValue(s);
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
            onClick={async (event) => {
              await ipcRenderer.invoke(Events.ResetSchedule);
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
      destroyOnClose
      title={t('settings')}
    >
      <Form
        form={form}
        labelCol={{ span: 4 }}
        labelWrap
        onValuesChange={async (changedValues, values) => {
          await settingsService.save(values);
          await props.onChange?.({
            ...settings,
            ...values,
          } as Settings);
          checkIsChanged();
        }}
      >
        <Form.Item label={t('language')} name="locale">
          <Select
            className={styles.formItem}
            options={[
              { label: '简体中文', value: Locale.zhCN },
              { label: 'English', value: Locale.enUS },
            ]}
          />
        </Form.Item>

        <Form.Item label={t('wallpaperMode')} name="wallpaperMode">
          <Select
            className={styles.formItem}
            options={[
              { label: t('wallpaperMode.cover'), value: WallpaperMode.Cover },
              {
                label: t('wallpaperMode.replace'),
                value: WallpaperMode.Replace,
              },
            ]}
            onChange={async (value) => {
              if (value === WallpaperMode.Replace) {
                if (platform) {
                  form.setFieldsValue({
                    scaleMode: DEFAULT_NATIVE_SCALE_MODE[platform as string],
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
              wallpaperMode === WallpaperMode.Replace &&
              platform === 'linux'
            ) {
              return null;
            }

            return (
              <>
                <ScaleModeComponent scaleType={ScaleType.Native}>
                  {(scaleModeOptions) => {
                    return (
                      <Form.Item
                        hidden={wallpaperMode === WallpaperMode.Cover}
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

                <ScaleModeComponent scaleType={ScaleType.Web}>
                  {(scaleModeOptions) => {
                    return (
                      <Form.Item
                        hidden={wallpaperMode === WallpaperMode.Replace}
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

        <Form.Item label={t('settings.downloadsDir')} name="downloadsDir">
          <Input.Search
            style={{ width: '70%' }}
            enterButton={<Button type="primary">{t('choose')}</Button>}
            onSearch={async () => {
              const file = await ipcRenderer.invoke(Events.SelectDir);
              form.setFieldValue('downloadsDir', file?.[0]);
              await settingsService.save(form.getFieldsValue());
              await props.onChange?.(form.getFieldsValue());
              checkIsChanged();
            }}
          />
        </Form.Item>

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
              ipcRenderer.invoke(Events.SetLiveWallpaperVolume, volume);
              settingsService.get().then((settings) => {
                settingsService.save({
                  ...settings,
                  volume,
                });
              });
            }, 200)}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
