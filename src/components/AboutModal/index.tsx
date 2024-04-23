import React, { useState } from 'react';
import { ModalFormProps, TranslationFunc } from '../../../cross/interface';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { useUpdateEffect } from 'ahooks';
import { ipcRenderer } from 'electron';
import { Events } from '../../../cross/enums';
import Update from '@/components/Update';
import { Descriptions, Modal, ModalProps, Space, Button, Badge } from 'antd';

export interface AboutModalProps extends ModalFormProps {
  versionInfo?: VersionInfo;
  open: ModalProps['open'];
}
const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { t }: { t: TranslationFunc } = useTranslation();
  const [version, setVersion] = useState('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo>();

  async function getVersion() {
    const ver = await ipcRenderer.invoke(Events.GetVersion);
    setVersion(ver);
  }

  useUpdateEffect(() => {
    setVersionInfo(props.versionInfo);
    if (props.open) {
      getVersion();
    }
  }, [props.versionInfo, props.open]);

  return (
    <Modal
      title={t('about')}
      {...(props.modalProps || {})}
      footer={
        <Button onClick={props.modalProps?.onCancel}>{t('close')}</Button>
      }
      destroyOnClose
    >
      <Space direction="vertical">
        <Descriptions
          column={1}
          items={[
            {
              key: '0',
              label: t('currentVersion'),
              children: version,
            },
            {
              key: '2',
              label: t('latestVersion'),
              children: (
                <Badge dot count={versionInfo?.update ? 1 : 0}>
                  <span>{versionInfo?.newVersion || '-'}</span>
                </Badge>
              ),
            },
          ]}
        />

        <Update
          versionInfo={versionInfo}
          onUpdateAvailable={(v) => {
            setVersionInfo(v);
          }}
        />
      </Space>
    </Modal>
  );
};

export default AboutModal;
