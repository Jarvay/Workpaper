import React, { useState } from 'react';
import { Badge, Button, Form, Modal, Select, Slider, Space } from 'antd';
import {
  ModalFormProps,
  Settings,
  TranslationFunc,
} from '../../../cross/interface';
import { debounce, omit } from 'lodash';
import { useMount, useUpdateEffect } from 'ahooks';
import { settingsService } from '@/services/settings';
import { Events, Locale, WallpaperMode } from '../../../cross/enums';
import { useTranslation } from 'react-i18next';
import ScaleModeComponent from '@/components/ScaleModeComponent';
import styles from './index.module.less';
import { ipcRenderer } from 'electron';
import Update from '@/components/Update';

export interface SettingsModalProps extends ModalFormProps<Settings> {
  versionInfo?: VersionInfo;
}

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const [form] = Form.useForm();
  const [version, setVersion] = useState('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();
  const [settings, setSettings] = useState<Settings>();
  const [platform, setPlatform] = useState<NodeJS.Platform>();

  const { t }: { t: TranslationFunc } = useTranslation();

  async function getVersion() {
    const ver = await ipcRenderer.invoke(Events.GetVersion);
    setVersion(ver);
  }

  useMount(async () => {
    setPlatform(await ipcRenderer.invoke(Events.GetPlatform));
  });

  useUpdateEffect(() => {
    if (props.open) {
      settingsService.get().then((settings) => {
        setSettings(settings);
        form.resetFields();
        form.setFieldsValue({
          ...settings,
        });
      });

      getVersion();

      if (props.versionInfo) {
        setVersionInfo(props.versionInfo);
      }
    }
  }, [props.open]);

  return (
    <Modal
      {...omit(props, ['values', 'onOk'])}
      footer={
        <Button
          onClick={(event) =>
            props.onCancel?.(
              event as React.MouseEvent<HTMLButtonElement, MouseEvent>,
            )
          }
        >
          {t('close')}
        </Button>
      }
      destroyOnClose
      title={t('settings')}
    >
      <Form
        form={form}
        labelCol={{ span: 4 }}
        labelWrap
        onValuesChange={async (changedValues, values) => {
          await settingsService.save(values);
          await props.onChange?.(values as Settings);
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
              <ScaleModeComponent>
                {(scaleModeOptions) => {
                  const name =
                    settings?.wallpaperMode === WallpaperMode.Cover
                      ? 'webScaleMode'
                      : 'scaleMode';
                  return (
                    <Form.Item label={t('scaleMode')} name={name}>
                      <Select
                        className={styles.formItem}
                        options={scaleModeOptions}
                      />
                    </Form.Item>
                  );
                }}
              </ScaleModeComponent>
            );
          }}
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

        <Form.Item label={t('currentVersion')}>
          <span>{version}</span>
        </Form.Item>

        <Form.Item label={t('latestVersion')}>
          <Space>
            {!!versionInfo?.newVersion ? (
              <Badge dot>
                <span>{versionInfo?.newVersion}</span>
              </Badge>
            ) : (
              <span>-</span>
            )}

            <Update
              versionInfo={versionInfo}
              onUpdateAvailable={(versionInfo) => {
                setVersionInfo(versionInfo);
              }}
            />
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
