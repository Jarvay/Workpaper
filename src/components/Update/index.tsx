import React, { useCallback, useState } from 'react';
import { Button, message, Modal, Progress, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { ipcRenderer } from 'electron';
import type { ProgressInfo, UpdateCheckResult } from 'electron-updater';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { hasIn } from 'lodash';

interface UpdateError {
  message: string;
  error: Error;
}

type CheckUpdateResult = null | UpdateError | UpdateCheckResult;

export interface UpdateProps {
  onUpdateAvailable?: (versionInfo: VersionInfo) => void;
  versionInfo?: VersionInfo;
}

const Update: React.FC<UpdateProps> = (props) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const onUpdateCanAvailable = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: VersionInfo) => {
      setUpdateAvailable(arg1.update);
      props.onUpdateAvailable?.(arg1);
    },
    [],
  );

  const onUpdateError = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: ErrorType) => {
      console.error('onUpdateError', arg1);
    },
    [],
  );

  const onDownloadProgress = useCallback(
    (_event: Electron.IpcRendererEvent, arg1: ProgressInfo) => {
      console.log('onDownloadProgress', arg1);
      setProgress(Number(arg1.percent.toFixed(2)));
    },
    [],
  );

  const onUpdateDownloaded = useCallback(
    (_event: Electron.IpcRendererEvent, ...args: any[]) => {
      setProgress(100);
    },
    [],
  );

  function showInstallModal() {
    Modal.confirm({
      content: t('updateTips'),
      onOk: async () => {
        await ipcRenderer.invoke('quit-and-install');
        setDownloading(false);
      },
    });
  }

  useMount(() => {
    ipcRenderer.on('update-can-available', onUpdateCanAvailable);
    ipcRenderer.on('update-error', onUpdateError);
    ipcRenderer.on('download-progress', onDownloadProgress);
    ipcRenderer.on('update-downloaded', onUpdateDownloaded);

    if (props.versionInfo?.update) {
      setUpdateAvailable(true);
    }
  });

  useUnmount(() => {
    ipcRenderer.off('update-can-available', onUpdateCanAvailable);
    ipcRenderer.off('update-error', onUpdateError);
    ipcRenderer.off('download-progress', onDownloadProgress);
    ipcRenderer.off('update-downloaded', onUpdateDownloaded);
  });

  useUpdateEffect(() => {
    if (props.versionInfo?.update) {
      setUpdateAvailable(true);
    }
  }, [props.versionInfo]);

  useUpdateEffect(() => {
    if (progress >= 100) {
      showInstallModal();
    }
  }, [progress]);

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
            const result: CheckUpdateResult =
              await ipcRenderer.invoke('check-update');
            setLoading(false);
            if (!result) return;
            if (hasIn(result, 'error') && hasIn(result, 'message')) {
              message.error((result as UpdateError).message);
              return;
            }
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
            await ipcRenderer.invoke('start-download');
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
                await ipcRenderer.invoke('quit-and-install');
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
