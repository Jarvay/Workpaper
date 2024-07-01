import React, { useState } from 'react';
import { ruleService } from '@/services/rule';
import { useMount, useUnmount } from 'ahooks';
import { ipcRenderer } from 'electron';
import {
  RuleType,
  Events,
  FormMode,
  WallpaperType,
} from '../../../cross/enums';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { Button, Divider, Popconfirm, Space, Tag } from 'antd';
import WallpaperRule from './components/WallpaperRuleModal';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { weekdayService } from '@/services/weekday';
import { Album, Rule, Weekday } from '../../../cross/interface';
import { useTranslation } from 'react-i18next';
import WeekComponent from '@/components/WeekComponent';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';
import { albumService } from '@/services/album';

const RuleIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<Rule[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Rule>();
  const [weekday, setWeekday] = useState<Weekday>();
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);

  const navigate = useNavigate();
  const { id: weekdayId } = useParams();

  const { t } = useTranslation();

  async function refresh() {
    setLoading(true);
    const rules = await ruleService.get();
    setDataSource(rules.filter((rule) => rule.weekdayId === weekdayId));
    setLoading(false);
  }

  function fetchAlbums() {
    albumService.get().then((value) => setAlbums(value));
  }

  useMount(async () => {
    await refresh();
    setWeekday(
      (await weekdayService.get()).find((item) => item.id === weekdayId),
    );
    fetchAlbums();
  });

  useUnmount(() => {
    ipcRenderer.removeAllListeners(Events.ResetSchedule);
  });

  const columns: ColumnsType<Rule> = [
    {
      title: t('rule.timeSlot'),
      dataIndex: 'time',
      width: 180,
      render: (value, record) => {
        return (
          <span>
            {record.start} - {record.end}
          </span>
        );
      },
    },
    {
      title: t('rule.type'),
      dataIndex: 'type',
      width: 120,
      render: (value) => {
        switch (value) {
          default:
          case RuleType.Fixed:
            return t('rule.type.fixed');
          case RuleType.Album:
            return t('rule.type.autoChange');
          case RuleType.Marquee:
            return t('rule.type.marquee');
        }
      },
    },
    {
      title: t('rule.album'),
      dataIndex: 'albumId',
      width: 120,
      ellipsis: true,
      render: (value, record) => {
        const album = albums.find((album) => album.id === record.albumId);
        return album?.name;
      },
    },
    {
      title: t('rule.interval'),
      dataIndex: 'interval',
      width: 120,
      render: (value, record) => {
        const album = albums.find((album) => album.id === record.albumId);
        const showInterval =
          album?.wallpaperType === WallpaperType.Image &&
          record.type === RuleType.Album;
        if (showInterval) {
          return value || '-';
        }
        return '-';
      },
    },
    {
      title: t('rule.isRandom'),
      dataIndex: 'isRandom',
      width: 120,
      render: (value, record) => {
        if (record.type !== RuleType.Album) {
          return '-';
        }
        return value ? t('yes') : t('no');
      },
    },
    {
      title: t('operation'),
      dataIndex: 'options',
      width: 180,
      fixed: 'right',
      render: (value, record) => {
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
                await ruleService.delete(record.id as string);
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            shape="circle"
            onClick={() => {
              navigate(-1);
            }}
          >
            <ArrowLeftOutlined />
          </Button>

          <Button type="primary" onClick={() => setCreateModalOpen(true)}>
            <PlusOutlined />
            {t('create')}
          </Button>

          <WallpaperRule
            mode={FormMode.Create}
            weekdayId={weekdayId}
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
          title={() => (
            <WeekComponent>
              {(weekMap) => {
                return (
                  <div>
                    {weekday?.days.map((day, index) => (
                      <Tag color="blue" key={index}>
                        {weekMap.get(day)}
                      </Tag>
                    ))}
                  </div>
                );
              }}
            </WeekComponent>
          )}
          bordered
          pagination={false}
          scroll={{ y: 600 }}
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          loading={loading}
        />

        <WallpaperRule
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

export default RuleIndex;
