import React, { useState } from 'react';
import { ModalFormProps } from '@/others/types.ts';
import { useTranslation } from 'react-i18next';
import styles from './index.module.less';
import { useUpdateEffect } from 'ahooks';
import Update from '@/components/Update';
import { Badge, Button, Descriptions, Modal, ModalProps, Space } from 'antd';
import { Update as UpdateInfo } from '@tauri-apps/plugin-updater';
import { getVersion } from '@tauri-apps/api/app';

export type AboutModalProps = ModalFormProps & {
  update?: UpdateInfo;
  open: ModalProps['open'];
};

const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { t } = useTranslation();
  const [version, setVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();

  async function getAppVersion() {
    const ver = await getVersion();
    setVersion(ver);
  }

  useUpdateEffect(() => {
    setUpdateInfo(props.update);
    if (props.open) {
      getAppVersion();
    }
  }, [props.update, props.open]);

  return (
    <Modal
      title={t('about')}
      {...(props.modalProps || {})}
      open={props.open}
      footer={
        <Button onClick={props.modalProps?.onCancel}>{t('close')}</Button>
      }
      destroyOnHidden
    >
      <Space direction="vertical">
        <Descriptions
          className={styles.descContainer}
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
                <Badge dot count={!!updateInfo ? 1 : 0}>
                  <span>{updateInfo?.version || '-'}</span>
                </Badge>
              ),
            },
          ]}
        />

        <Update
          update={updateInfo}
          onUpdateAvailable={(update) => {
            setUpdateInfo(update);
          }}
        />
      </Space>
    </Modal>
  );
};

export default AboutModal;
