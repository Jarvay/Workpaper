import React, { useState } from 'react';
import { useMount } from 'ahooks';
import { FormMode } from '@/others/enums';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { Button, ColorPicker, Divider, Popconfirm, Space } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Marquee } from '@/others/types.ts';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';
import { marqueeService } from '@/services/marquee';
import MarqueeModal from '@/pages/marquee/components/MarqueeModal';
import { ruleService } from '@/services/rule.ts';
import { useMessageApi } from '@/components/GlobalContext';

const MarqueeIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<Marquee[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Marquee>();
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const messageApi = useMessageApi();

  async function refresh() {
    setLoading(true);
    const marquees = await marqueeService.get();
    setDataSource(marquees);
    setLoading(false);
  }

  useMount(async () => {
    await refresh();
  });

  const columns: ColumnsType<Marquee> = [
    {
      title: t('marquee.name'),
      dataIndex: 'name',
      width: 180,
    },
    {
      title: t('marquee.text'),
      dataIndex: 'text',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('marquee.textColor'),
      dataIndex: 'textColor',
      width: 120,
      render: (value) => {
        return <ColorPicker value={value} disabled />;
      },
    },
    {
      title: t('marquee.backgroundColor'),
      dataIndex: 'backgroundColor',
      width: 100,
      render: (value) => {
        return <ColorPicker value={value} disabled />;
      },
    },
    {
      title: t('marquee.speed'),
      dataIndex: 'speed',
      width: 100,
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
                const using = (await ruleService.get()).some(
                  (item) => item.marqueeId === record.id,
                );
                if (using) {
                  messageApi.warning(t('usingTips'));
                  return;
                }

                await marqueeService.delete(record.id as string);
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

          <MarqueeModal
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

        <MarqueeModal
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

export default MarqueeIndex;
