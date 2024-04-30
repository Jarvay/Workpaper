import React, { useState } from 'react';
import PageContainer from '@/components/PageContainer';
import { Image, List, message, Skeleton, Space } from 'antd';
import {
  DownloadArg,
  WallpaperItem,
  WallpaperWebsite,
} from '../../../cross/interface';
import { useParams } from 'react-router-dom';
import { useMount, useUpdateEffect } from 'ahooks';
import { websiteService } from '@/services/website';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios, { AxiosRequestConfig } from 'axios';
import {
  Events,
  WallpaperWebsiteRequestParamType,
  WebsitePlaceholder,
} from '../../../cross/enums';
import { get } from 'lodash';
import styles from './website.module.less';
import { DownloadOutlined } from '@ant-design/icons';
import { ipcRenderer } from 'electron';
import { useTranslation } from 'react-i18next';
import { useGlobalContext } from '@/components/GlobalContext';

export interface WebsiteRouteParams extends Record<string, string> {
  id: string;
}

const PAGE_SIZE = 24;

const Website: React.FC = () => {
  const { id } = useParams<WebsiteRouteParams>();
  const [website, setWebsite] = useState<WallpaperWebsite>();
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);
  const [dateSource, setDataSource] = useState<WallpaperItem[]>([]);

  const { t } = useTranslation();

  const { downloadDrawerRef } = useGlobalContext();

  async function fetchWebsite() {
    const result = await websiteService.getById(id as string);
    if (result) {
      setWebsite(result);
    }
  }

  async function loadMore() {
    if (!website) return;
    const requestConfig: AxiosRequestConfig = {
      url: website.request.url,
      method: website.request.method,
    };

    let params: Record<string, any> = {};
    if (Array.isArray(website.request.params)) {
      website.request.params.forEach((item) => {
        switch (item.type) {
          case WallpaperWebsiteRequestParamType.Placeholder:
            switch (item.value) {
              case WebsitePlaceholder.Page:
                params[item.key] = page;
                break;
              case WebsitePlaceholder.PageSize:
                params[item.key] = PAGE_SIZE;
                break;
              case WebsitePlaceholder.CurrentCount:
                params[item.key] = dateSource.length;
                break;
            }
            break;
          case WallpaperWebsiteRequestParamType.String:
            params[item.key] = String(item.value);
            break;
          case WallpaperWebsiteRequestParamType.Number:
            params[item.key] = Number(item.value);
            break;
        }
      });
    }

    switch (website.request.method) {
      case 'GET':
        requestConfig.params = params;
        break;
      case 'POST':
        requestConfig.data = params;
        break;
    }
    const { data } = await axios.request(requestConfig);
    const listKey = website.responseKey.list;
    const list: Record<string, any> = !!listKey ? get(data, listKey) : data;
    if (Array.isArray(list)) {
      const newData: WallpaperItem[] = [];
      list.forEach((item) => {
        newData.push({
          raw: get(item, website.responseKey.rawInItem),
          thumb: get(item, website.responseKey.thumbInItem),
        });
      });

      setDataSource(dateSource.concat(newData));
      setPage(page + 1);
    }
  }

  useMount(async () => {
    await fetchWebsite();
  });

  useUpdateEffect(() => {
    loadMore();
  }, [website]);

  useUpdateEffect(() => {
    if (page <= 3) {
      loadMore();
    }
  }, [page]);

  return (
    <PageContainer>
      <div
        id="scrollableDiv"
        style={{
          height: 'calc(100vh - 4em)',
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <InfiniteScroll
          next={loadMore}
          hasMore={hasMore}
          loader={null}
          dataLength={dateSource.length * 10}
          scrollableTarget="scrollableDiv"
          style={{
            overflowX: 'hidden',
          }}
        >
          <List<WallpaperItem>
            grid={{ gutter: 8, xxl: 6, xl: 5, lg: 4 }}
            dataSource={dateSource}
            renderItem={(item) => {
              return (
                <List.Item>
                  <Image
                    className={styles.websiteWallpaperImage}
                    src={item.thumb}
                    placeholder={<Skeleton.Image active />}
                    preview={{
                      src: item.raw,
                      toolbarRender: () => {
                        return (
                          <Space
                            size={12}
                            className="ant-image-preview-operations"
                          >
                            <DownloadOutlined
                              className="ant-image-preview-operations-operation"
                              style={{ fontSize: '20px' }}
                              onClick={async () => {
                                const downloadList =
                                  downloadDrawerRef?.getList() || [];
                                const exists = downloadList.some(
                                  (it) => it.url === item.raw,
                                );
                                if (exists) {
                                  message.warning(t('downloadExists'));
                                  return;
                                }
                                ipcRenderer.send(Events.Download, {
                                  url: item.raw,
                                  thumb: item.thumb,
                                } as DownloadArg);
                                await message.info(t('downloadStarted'));
                              }}
                            />
                          </Space>
                        );
                      },
                    }}
                  />
                </List.Item>
              );
            }}
          />
        </InfiniteScroll>
      </div>
    </PageContainer>
  );
};

export default Website;
