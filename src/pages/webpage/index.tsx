import React, { useState } from 'react';
import { useMount } from 'ahooks';
import { FormMode } from '@/others/enums';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { Button, Divider, Popconfirm, Space } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Webpage } from '@/others/types.ts';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';
import { webpageService } from '@/services/webpage';
import WebpageModal from '@/pages/webpage/components/WebpageModal';
import { openUrl } from '@tauri-apps/plugin-opener';

const WebpageIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<Webpage[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Webpage>();
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();

  async function refresh() {
    setLoading(true);
    const webpages = await webpageService.get();
    setDataSource(webpages);
    setLoading(false);
  }

  useMount(async () => {
    await refresh();
  });

  const columns: ColumnsType<Webpage> = [
    {
      title: t('webpage.name'),
      dataIndex: 'name',
      width: 180,
    },
    {
      title: t('webpage.url'),
      dataIndex: 'text',
      width: 200,
      ellipsis: true,
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
                openUrl(record.url);
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
                await webpageService.delete(record.id as string);
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

          <WebpageModal
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

        <WebpageModal
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

export default WebpageIndex;
