import React, { useState } from 'react';
import { Button, List, Popconfirm, Space, Tag } from 'antd';
import WeekdayModal from './components/WeekdayModal';
import { FormMode } from '../../../cross/enums';
import { useMount } from 'ahooks';
import { weekdayService } from '@/services/weekday';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WeekComponent from '@/components/WeekComponent';
import { TranslationFunc, Weekday } from '../../../cross/interface';
import { ipcRenderer } from 'electron';
import PageContainer from '@/components/PageContainer';

const Home: React.FC = () => {
  const [dateSource, setDataSource] = useState<Weekday[]>([]);
  const [createWeekDayOpen, setCreateWeekDayOpen] = useState(false);
  const [updateWeekDayOpen, setUpdateWeekDayOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Weekday>();

  const { t }: { t: TranslationFunc } = useTranslation();

  async function refresh() {
    setDataSource(await weekdayService.get());
  }

  useMount(() => {
    refresh();
  });

  return (
    <PageContainer>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" onClick={() => setCreateWeekDayOpen(true)}>
            {t('create')}
          </Button>

          <WeekdayModal
            mode={FormMode.Create}
            open={createWeekDayOpen}
            onChange={async () => {
              setCreateWeekDayOpen(false);
              await refresh();
            }}
            modalProps={{
              onCancel: () => setCreateWeekDayOpen(false),
            }}
          />
        </div>
        <List
          style={{ width: '100%' }}
          dataSource={dateSource}
          renderItem={(item) => {
            return (
              <List.Item
                actions={[
                  <Link to={`/weekday/${item.id}`} key="detail">
                    {t('check')}
                  </Link>,
                  <React.Fragment key="update">
                    <a
                      onClick={() => {
                        setCurrentRow(item);
                        setUpdateWeekDayOpen(true);
                      }}
                    >
                      {t('edit')}
                    </a>

                    <WeekdayModal
                      mode={FormMode.Update}
                      open={updateWeekDayOpen}
                      modalProps={{
                        onCancel: () => setUpdateWeekDayOpen(false),
                      }}
                      onChange={async () => {
                        setUpdateWeekDayOpen(false);
                        refresh();
                      }}
                      values={currentRow}
                    />
                  </React.Fragment>,
                  <Popconfirm
                    title={t('deleteConfirmTips')}
                    onConfirm={async () => {
                      await weekdayService.delete(item?.id as string);
                      await refresh();
                    }}
                  >
                    <a key="delete">{t('delete')}</a>
                  </Popconfirm>,
                ]}
              >
                <WeekComponent>
                  {(weekMap) => {
                    return (
                      <div>
                        {item.days.map((day) => (
                          <Tag color="blue">{weekMap.get(day)}</Tag>
                        ))}
                      </div>
                    );
                  }}
                </WeekComponent>
              </List.Item>
            );
          }}
        />
      </Space>
    </PageContainer>
  );
};

export default Home;
