import React, { useState } from 'react';
import { useMount, useUnmount } from 'ahooks';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { TranslationFunc, WallpaperWebsite } from '../../../cross/interface';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';
import { Button, Divider, message, Popconfirm, Space } from 'antd';
import { Events, FormMode, WallpaperWebsiteType } from '../../../cross/enums';
import WallpaperWebsiteModal from '@/pages/lib/components/WallpaperWebsiteModal';
import { websiteService } from '@/services/website';
import { useNavigate } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
  SyncOutlined,
  ZoomInOutlined,
} from '@ant-design/icons';

const LibIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<WallpaperWebsite[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<WallpaperWebsite>();
  const [syncing, setSyncing] = useState(false);

  const { t }: { t: TranslationFunc } = useTranslation();
  const navigate = useNavigate();

  async function refresh() {
    setDataSource(await websiteService.get());
  }

  useMount(async () => {
    await refresh();
  });

  const columns: ColumnsType<WallpaperWebsite> = [
    {
      title: t('lib.name'),
      dataIndex: 'name',
    },
    {
      title: t('operation'),
      dataIndex: 'options',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        return (
          <Space split={<Divider type="vertical" />}>
            <GlobalOutlined
              className="icon-button"
              onClick={async () => {
                switch (record.type) {
                  case WallpaperWebsiteType.Api:
                    navigate(`/website/${record.id}`);
                    break;
                  case WallpaperWebsiteType.Website:
                    await ipcRenderer.invoke(Events.OpenExternal, record.url);
                    break;
                }
              }}
            />

            <EditOutlined
              className="icon-button"
              onClick={() => {
                setCurrentRow(record);
                setUpdateModalOpen(true);
              }}
            />

            <Popconfirm
              title={t('deleteConfirmTips')}
              onConfirm={async () => {
                await websiteService.delete(record.id as string);
                await refresh();
              }}
            >
              <DeleteOutlined className="icon-button" />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button type="primary" onClick={() => setCreateModalOpen(true)}>
              <PlusOutlined />
              {t('create')}
            </Button>

            <Button
              loading={syncing}
              onClick={async () => {
                setSyncing(true);
                await websiteService.sync();
                await refresh();
                setSyncing(false);
                message.success(t('operationSuccess'));
              }}
            >
              <SyncOutlined />
              {t('sync')}
            </Button>
          </Space>

          <WallpaperWebsiteModal
            mode={FormMode.Create}
            open={createModalOpen}
            modalProps={{
              onCancel: () => setCreateModalOpen(false),
            }}
            onChange={async () => {
              setCreateModalOpen(false);
              await refresh();
            }}
          />
        </div>

        <CenterTable
          bordered
          pagination={false}
          scroll={{ y: 600 }}
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
        />
      </Space>

      <WallpaperWebsiteModal
        mode={FormMode.Update}
        open={updateModalOpen}
        values={currentRow}
        modalProps={{
          onCancel: () => setUpdateModalOpen(false),
        }}
        onChange={async () => {
          setUpdateModalOpen(false);
          await refresh();
        }}
      />
    </PageContainer>
  );
};

export default LibIndex;
