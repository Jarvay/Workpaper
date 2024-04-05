import React, { useState } from 'react';
import { ruleService } from '@/services/rule';
import { useMount, useUnmount } from 'ahooks';
import { ipcRenderer } from 'electron';
import {
  ChangeType,
  Events,
  FormMode,
  WallpaperType,
} from '../../../cross/enums';
import { ColumnsType } from 'antd/es/table/InternalTable';
import { Button, Image, Popconfirm, Space } from 'antd';
import WallpaperRule from './components/WallpaperRuleModal';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { weekdayService } from '@/services/weekday';
import { Rule, TranslationFunc, Weekday } from '../../../cross/interface';
import { useTranslation } from 'react-i18next';
import WeekComponent from '@/components/WeekComponent';
import PageContainer from '@/components/PageContainer';
import CenterTable from '@/components/CenterTable';

const RuleIndex: React.FC = () => {
  const [dataSource, setDataSource] = useState<Rule[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Rule>();
  const [weekday, setWeekday] = useState<Weekday>();

  const navigate = useNavigate();
  const { id: weekdayId } = useParams();

  const { t }: { t: TranslationFunc } = useTranslation();

  async function refresh() {
    const rules = await ruleService.get();
    setDataSource(rules.filter((rule) => rule.weekdayId === weekdayId));
  }

  useMount(async () => {
    await refresh();
    setWeekday(
      (await weekdayService.get()).find((item) => item.id === weekdayId),
    );
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
      title: t('rule.period'),
      dataIndex: 'days',
      width: 200,
      render: () => {
        return (
          <WeekComponent>
            {(weekMap) => {
              return weekday?.days?.map((day) => weekMap.get(day)).join(', ');
            }}
          </WeekComponent>
        );
      },
    },
    {
      title: t('rule.wallpaperType'),
      dataIndex: 'wallpaperType',
      width: 120,
      render: (value) => {
        switch (value) {
          default:
          case WallpaperType.Image:
            return t('rule.wallpaperType.image');
          case WallpaperType.Video:
            return t('rule.wallpaperType.video');
        }
      },
    },
    {
      title: t('rule.type'),
      dataIndex: 'type',
      width: 120,
      render: (value) => {
        switch (value) {
          default:
          case ChangeType.Fixed:
            return t('rule.type.fixed');
          case ChangeType.AutoChange:
            return t('rule.type.autoChange');
        }
      },
    },
    {
      title: t('rule.path'),
      dataIndex: 'path',
      width: 250,
      ellipsis: true,
      render: (value, record) => {
        switch (record.type) {
          default:
          case ChangeType.Fixed:
            switch (record.wallpaperType) {
              default:
              case WallpaperType.Image:
                return (
                  <Space>
                    {record.paths?.map((item) => {
                      return (
                        <Image
                          style={{
                            objectFit: 'contain',
                          }}
                          key={item}
                          height={64}
                          width={64}
                          src={`file://${item}`}
                        />
                      );
                    })}
                  </Space>
                );
              case WallpaperType.Video:
                return (
                  <Space>
                    {record.paths?.map((item) => {
                      return (
                        <video
                          key={item}
                          height={64}
                          width={64}
                          src={`file://${item}`}
                        />
                      );
                    })}
                  </Space>
                );
            }

          case ChangeType.AutoChange:
            return <span>{value}</span>;
        }
      },
    },
    {
      title: t('rule.interval'),
      dataIndex: 'interval',
      width: 120,
      render: (value, record) => {
        if (record.wallpaperType === WallpaperType.Video) {
          return '-';
        }
        return value || '-';
      },
    },
    {
      title: t('rule.isRandom'),
      dataIndex: 'isRandom',
      width: 120,
      render: (value) => {
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
          <Space>
            <a
              onClick={() => {
                setCurrentRow(record);
                setUpdateModalOpen(true);
              }}
            >
              {t('edit')}
            </a>

            <Popconfirm
              title={t('deleteConfirmTips')}
              onConfirm={async () => {
                await ruleService.delete(record.id as string);
                await refresh();
              }}
            >
              <a>{t('delete')}</a>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: '100%' }}>
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
            {t('create')}
          </Button>

          <WallpaperRule
            mode={FormMode.Create}
            weekdayId={weekdayId}
            open={createModalOpen}
            onCancel={() => setCreateModalOpen(false)}
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

        <WallpaperRule
          open={updateModalOpen}
          onCancel={() => setUpdateModalOpen(false)}
          values={currentRow}
          mode={FormMode.Update}
          onChange={() => {
            setUpdateModalOpen(false);
            refresh();
          }}
        />
      </Space>
    </PageContainer>
  );
};

export default RuleIndex;
