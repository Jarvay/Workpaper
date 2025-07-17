import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Card, Drawer, DrawerProps, Image, List, Progress, Space } from 'antd';
import { useMount, useUnmount, useUpdateEffect } from 'ahooks';
import { Events } from '@/others/enums';
import { DownloadEvent } from '@/others/types.ts';
import { omit } from 'lodash';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export type DownloadDrawerActions = {
  getList: () => DownloadItem[];
};

export type DownloadDrawerProps = {
  drawerProps?: Omit<DrawerProps, 'open'>;
  open?: DrawerProps['open'];
};

type DownloadItem = Omit<DownloadEvent, 'event'>;

const DownloadDrawer = forwardRef<DownloadDrawerActions, DownloadDrawerProps>(
  (props, ref) => {
    const [downloadList, setDownloadList] = useState<DownloadItem[]>([]);

    const downloadUnlistenFnRef = useRef<UnlistenFn>();

    useImperativeHandle(ref, () => {
      return {
        getList: () => downloadList,
      };
    });

    const downloadEventListener: (event: any, ...args: any[]) => void = (
      _,
      event: DownloadEvent,
    ) => {
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

    async function registerListener() {
      downloadUnlistenFnRef.current?.();
      downloadUnlistenFnRef.current = await listen(
        Events.OnDownloadUpdated,
        downloadEventListener,
      );
    }

    useMount(async () => {
      registerListener();
    });

    useUpdateEffect(() => {
      registerListener();
    }, [downloadList]);

    useUnmount(async () => {
      downloadUnlistenFnRef.current?.();
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
          renderItem={(item) => {
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
