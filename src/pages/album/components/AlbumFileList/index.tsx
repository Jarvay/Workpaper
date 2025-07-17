import React, { useState } from 'react';
import { Button, Image, List } from 'antd';
import { cloneDeep } from 'lodash';
import { Events, WallpaperType } from '@/others/enums';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { useUpdateEffect } from 'ahooks';
import ClosableBox from '@/components/ClosableBox';
import {
  AlbumFileListItem,
  ToAlbumFileListItemParams,
} from '@/others/types.ts';
import { IMAGE_EXT_LIST, VIDEO_EXT_LIST } from '@/others/consts.ts';
import { open } from '@tauri-apps/plugin-dialog';

export type AlbumFileListProps = {
  id?: string;
  value?: AlbumFileListItem[];
  onChange?: (value: AlbumFileListItem[]) => void;
  wallpaperType: WallpaperType;
};

const AlbumFileList: React.FC<AlbumFileListProps> = (props) => {
  const [paths, setPaths] = useState<AlbumFileListItem[]>([]);
  const { wallpaperType, id, value } = props;
  const [loading, setLoading] = useState(false);

  const t = useTranslation().t;

  function renderPathItem(
    wallpaperType: WallpaperType,
    item: AlbumFileListItem,
  ) {
    const style: React.CSSProperties = {
      objectFit: 'cover',
      width: '80px',
      height: '80px',
    };

    switch (wallpaperType) {
      case WallpaperType.Image:
        return (
          <Image
            src={convertFileSrc(item.thumb)}
            preview={{
              src: convertFileSrc(item.path),
            }}
            style={style}
            alt=""
          />
        );
      case WallpaperType.Video:
        return <video src={convertFileSrc(item.path)} style={style} />;
    }
  }

  useUpdateEffect(() => {
    setPaths(cloneDeep(props.value || []));
  }, [props]);

  return (
    <span id={id}>
      <List
        loading={loading}
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          paddingTop: '16px',
        }}
        grid={{ column: 3 }}
        dataSource={value}
        renderItem={(item, index) => {
          return (
            <List.Item key={item.path}>
              <ClosableBox
                onClose={() => {
                  const newPaths = cloneDeep(paths);
                  newPaths.splice(index, 1);

                  setPaths(newPaths);
                  props.onChange?.(newPaths);
                }}
              >
                {renderPathItem(wallpaperType, item)}
              </ClosableBox>
            </List.Item>
          );
        }}
      />

      <Button
        type="primary"
        loading={loading}
        onClick={async () => {
          try {
            const extensions =
              wallpaperType === WallpaperType.Image
                ? IMAGE_EXT_LIST
                : VIDEO_EXT_LIST;
            const files = await open({
              multiple: true,
              filters: [{ name: 'Wallpaper', extensions }],
            });

            if (!files) return;

            setLoading(true);

            let result: AlbumFileListItem[] = [];
            if (wallpaperType === WallpaperType.Image) {
              result = await invoke(Events.ToAlbumListItem, {
                files,
                width: 96,
                quality: 60,
              } as ToAlbumFileListItemParams);
            } else if (wallpaperType === WallpaperType.Video) {
              result = files.map((item) => {
                return {
                  path: item,
                  thumb: '',
                };
              });
            }

            const newPaths = [...paths, ...(result || [])];
            setPaths(newPaths);
            props.onChange?.(newPaths);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        }}
      >
        {t('add')}
      </Button>
    </span>
  );
};

export default AlbumFileList;
