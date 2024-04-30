import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Card, Drawer, DrawerProps, Image, List, Progress, Space } from 'antd';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { Events } from '../../../cross/enums';
import { DownloadEvent } from '../../../cross/interface';
import { omit } from 'lodash';

export interface DownloadDrawerActions {
  getList: () => DownloadItem[];
}

export interface DownloadDrawerProps {
  drawerProps?: Omit<DrawerProps, 'open'>;
  open?: DrawerProps['open'];
}

type DownloadItem = Omit<DownloadEvent, 'event'>;

const DownloadDrawer = forwardRef<DownloadDrawerActions, DownloadDrawerProps>(
  (props, ref) => {
    const [downloadList, setDownloadList] = useState<DownloadItem[]>([]);

    useImperativeHandle(ref, () => {
      return {
        getList: () => downloadList,
      };
    });

    const downloadEventListener: (
      event: IpcRendererEvent,
      ...args: any[]
    ) => void = (_, event: DownloadEvent) => {
      if (event.event === 'start') {
        downloadList.push(omit(event, 'event'));
      }

      if (event.event === 'progress') {
        const item = downloadList.find((item) => item.md5 === event.md5);
        if (item) {
          item.progress = event.progress;
        }
      }

      setDownloadList(downloadList);
    };

    useMount(() => {
      ipcRenderer.on(Events.OnDownloadUpdated, downloadEventListener);
    });

    useUpdateEffect(() => {
      ipcRenderer.off(Events.OnDownloadUpdated, downloadEventListener);
      ipcRenderer.on(Events.OnDownloadUpdated, downloadEventListener);
    }, [downloadList]);

    useUnmount(() => {
      ipcRenderer.off(Events.OnDownloadUpdated, downloadEventListener);
    });

    return (
      <Drawer
        {...(props.drawerProps || {})}
        open={props.open}
        width="472px"
        styles={{
          body: {
            padding: '8px 16px',
          },
        }}
      >
        <List<DownloadItem>
          dataSource={downloadList}
          renderItem={(item, index) => {
            return (
              <List.Item>
                <Card
                  style={{
                    width: '100%',
                  }}
                  styles={{
                    body: {
                      padding: '8px',
                    },
                  }}
                >
                  <Space>
                    <Image
                      src={item.thumb}
                      style={{
                        width: '96px',
                        height: '96px',
                        objectFit: 'contain',
                      }}
                      preview={{
                        src: item.url,
                      }}
                    />

                    <Space direction="vertical">
                      <span>{item.filename}</span>

                      <Progress percent={item.progress} size="small" />
                    </Space>
                  </Space>
                </Card>
              </List.Item>
            );
          }}
        />
      </Drawer>
    );
  },
);

export default DownloadDrawer;
