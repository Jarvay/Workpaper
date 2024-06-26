import React, { useState } from 'react';
import { Button, List, Popconfirm, Space, Tag } from 'antd';
import WeekdayModal from './components/WeekdayModal';
import { FormMode } from '../../../cross/enums';
import { useMount } from 'ahooks';
import { weekdayService } from '@/services/weekday';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WeekComponent from '@/components/WeekComponent';
import { Weekday } from '../../../cross/interface';
import PageContainer from '@/components/PageContainer';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const Home: React.FC = () => {
  const [dateSource, setDataSource] = useState<Weekday[]>([]);
  const [createWeekDayOpen, setCreateWeekDayOpen] = useState(false);
  const [updateWeekDayOpen, setUpdateWeekDayOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Weekday>();

  const { t } = useTranslation();
  const navigate = useNavigate();

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
            <PlusOutlined />
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
                  <FolderOpenOutlined
                    className="icon-button"
                    onClick={() => {
                      navigate(`/weekday/${item.id}`);
                    }}
                  />,
                  <React.Fragment key="update">
                    <EditOutlined
                      className="icon-button"
                      onClick={() => {
                        setCurrentRow(item);
                        setUpdateWeekDayOpen(true);
                      }}
                    />

                    <WeekdayModal
                      mode={FormMode.Update}
                      open={updateWeekDayOpen}
                      modalProps={{
                        onCancel: () => setUpdateWeekDayOpen(false),
                      }}
                      onChange={async () => {
                        setUpdateWeekDayOpen(false);
                        await refresh();
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
                    <DeleteOutlined className="icon-button" key="delete" />
                  </Popconfirm>,
                ]}
              >
                <WeekComponent>
                  {(weekMap) => {
                    return (
                      <div>
                        {item.days.map((day, index) => (
                          <Tag color="blue" key={index}>
                            {weekMap.get(day)}
                          </Tag>
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
