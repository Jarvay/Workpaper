import React, { useState } from 'react';
import { Button, Modal, Progress, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { check, Update as UpdateInfo } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type UpdateProps = {
  onUpdateAvailable?: (update: UpdateInfo) => void;
  update?: UpdateInfo;
};

const Update: React.FC<UpdateProps> = (props) => {
  const { update } = props;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const [totalLength, setTotalLength] = useState(0);

  function showInstallModal() {
    Modal.confirm({
      content: t('updateTips'),
      onOk: async () => {
        setDownloading(false);
        await update?.install();
        await relaunch();
      },
    });
  }

  useMount(() => {
    if (update) {
      setUpdateAvailable(true);
    }
  });

  useUnmount(() => {});

  useUpdateEffect(() => {
    if (progress >= 100) {
      showInstallModal();
    }
  }, [progress]);

  useUpdateEffect(() => {
    if (update) {
      setUpdateAvailable(true);
    }
  }, [update]);

  return (
    <>
      {downloading && <Progress showInfo={false} percent={progress} />}

      {!updateAvailable ? (
        <Button
          style={{
            width: '100%',
          }}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            const result = await check();
            setLoading(false);
            if (!result) return;
          }}
        >
          {t('checkUpdate')}
        </Button>
      ) : (
        <Button
          style={{
            width: '100%',
          }}
          type="primary"
          disabled={downloading}
          onClick={async () => {
            setDownloading(true);
            await update?.download((progress) => {
              switch (progress.event) {
                case 'Started':
                  setTotalLength(progress.data.contentLength || 0);
                  break;
                case 'Progress':
                  setProgress(progress.data.chunkLength / totalLength);
                  break;
                case 'Finished':
                  setProgress(100);
                  break;
              }
            });
          }}
        >
          {t('download')}
        </Button>
      )}

      <Modal
        open={progressModalOpen}
        closable={false}
        footer={
          <Button onClick={() => setProgressModalOpen(false)}>
            {t('close')}
          </Button>
        }
        title={null}
      >
        <Space style={{ width: '100%' }} align="center" direction="vertical">
          <Progress type="circle" percent={progress} />

          {progress === 100 ? (
            <Button
              style={{
                width: '100%',
              }}
              onClick={async () => {
                await invoke('quit-and-install');
              }}
            >
              {t('update')}
            </Button>
          ) : null}
        </Space>
      </Modal>
    </>
  );
};

export default Update;
