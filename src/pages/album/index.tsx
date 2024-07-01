import React, { useState } from 'react';
import { albumService } from '@/services/album';
import { useMount, useUnmount } from 'ahooks';
import { ipcRenderer } from 'electron';
import {
  AlbumType,
  Events,
  FormMode,
  WallpaperDirection,
  WallpaperType,
} from '../../../cross/enums';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { Button, Divider, Popconfirm, Space } from 'antd';
import AlbumModal from './components/AlbumModal';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenFilled,
  PlusOutlined,
} from '@ant-design/icons';
import { Album } from '../../../cross/interface';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';

const AlbumIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<Album[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Album>();
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  async function refresh() {
    setLoading(true);
    const albums = await albumService.get();
    setDataSource(albums);
    setLoading(false);
  }

  useMount(async () => {
    await refresh();
  });

  useUnmount(() => {
    ipcRenderer.removeAllListeners(Events.ResetSchedule);
  });

  const columns: ColumnsType<Album> = [
    {
      title: t('album.name'),
      dataIndex: 'name',
      width: 180,
    },
    {
      title: t('album.wallpaperType'),
      dataIndex: 'wallpaperType',
      width: 120,
      render: (value) => {
        switch (value) {
          default:
            return '-';
          case WallpaperType.Image:
            return t('album.wallpaperType.image');
          case WallpaperType.Video:
            return t('album.wallpaperType.video');
        }
      },
    },
    {
      title: t('album.type'),
      dataIndex: 'type',
      width: 120,
      render: (value, record) => {
        switch (value) {
          default:
            return '-';
          case AlbumType.Directory:
            return t('album.type.directory');
          case AlbumType.Files:
            return t('album.type.files');
        }
      },
    },
    {
      title: t('album.dir'),
      dataIndex: 'dir',
      width: 250,
      render: (value, record) => {
        switch (record.type) {
          default:
            return '-';
          case AlbumType.Directory:
            return (
              <Space direction="horizontal" align="center">
                <span>{value}</span>

                <FolderOpenFilled
                  className="icon-button"
                  onClick={async () => {
                    await ipcRenderer.invoke(Events.OpenPath, value);
                  }}
                />
              </Space>
            );
        }
      },
    },
    {
      title: t('album.direction'),
      dataIndex: 'direction',
      width: 100,
      render: (value, record) => {
        if (record.wallpaperType !== WallpaperType.Image) {
          return '-';
        }
        switch (value) {
          default:
          case WallpaperDirection.Vertical:
            return t('rule.direction.vertical');
          case WallpaperDirection.Horizontal:
            return t('rule.direction.horizontal');
        }
      },
    },
    {
      title: t('operation'),
      dataIndex: 'options',
      width: 180,
      fixed: 'right',
      render: (_, record) => {
        return (
          <Space split={<Divider type="vertical" />}>
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
                await albumService.delete(record.id as string);
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
      <Space size={16} direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={() => setCreateModalOpen(true)}>
            <PlusOutlined />
            {t('create')}
          </Button>

          <AlbumModal
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
          loading={loading}
        />

        <AlbumModal
          open={updateModalOpen}
          modalProps={{
            onCancel: () => setUpdateModalOpen(false),
          }}
          values={currentRow}
          mode={FormMode.Update}
          onChange={async () => {
            setUpdateModalOpen(false);
            await refresh();
          }}
        />
      </Space>
    </PageContainer>
  );
};

export default AlbumIndex;
