import React from 'react';
import { Album, ModalFormProps } from '@/others/types.ts';
import { Button, Form, Input, Modal, Radio } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AlbumType,
  FormMode,
  WallpaperDirection,
  WallpaperType,
} from '@/others/enums';
import { albumService } from '@/services/album';
import { useUpdateEffect } from 'ahooks';
import AlbumFileList from '@/pages/album/components/AlbumFileList';
import { open } from '@tauri-apps/plugin-dialog';
import { useMessageApi } from '@/components/GlobalContext';

export type AlbumModalProps = ModalFormProps<Album> & {};

const AlbumModal: React.FC<AlbumModalProps> = (props) => {
  const [form] = Form.useForm<Album>();
  const wallpaperType: WallpaperType = Form.useWatch('wallpaperType', form);

  const { t } = useTranslation();
  const messageApi = useMessageApi();

  async function doCreate() {
    try {
      const values = await form.validateFields();
      await albumService.create(values as Album);
      messageApi.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = await form.validateFields();
      await albumService.update({
        ...props.values,
        ...values,
      } as Album);
      messageApi.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  useUpdateEffect(() => {
    if (props.open) {
      form.resetFields();
      form.setFieldsValue({
        ...(props.values || {}),
      });
    }
  }, [props.open]);

  return (
    <Modal
      {...(props.modalProps || {})}
      title={t('album')}
      open={props.open}
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
    >
      <Form<Album>
        form={form}
        labelCol={{ span: 4 }}
        initialValues={
          {
            wallpaperType: WallpaperType.Image,
            type: AlbumType.Directory,
            direction: WallpaperDirection.Horizontal,
          } as Partial<Album>
        }
      >
        <Form.Item
          label={t('album.name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item label={t('album.wallpaperType')} name="wallpaperType">
          <Radio.Group
            disabled={props.mode === FormMode.Update}
            onChange={() => {
              form.setFieldsValue({
                paths: [],
              });
            }}
            options={[
              {
                label: t('album.wallpaperType.image'),
                value: WallpaperType.Image,
              },
              {
                label: t('album.wallpaperType.video'),
                value: WallpaperType.Video,
              },
            ]}
          />
        </Form.Item>

        <>
          {wallpaperType === WallpaperType.Image && (
            <>
              <Form.Item label={t('album.direction')} name="direction">
                <Radio.Group
                  disabled={props.mode === FormMode.Update}
                  options={[
                    {
                      label: t('album.direction.horizontal'),
                      value: WallpaperDirection.Horizontal,
                    },
                    {
                      label: t('album.direction.vertical'),
                      value: WallpaperDirection.Vertical,
                    },
                  ]}
                  onChange={() => {
                    form.setFieldValue('isRandom', false);
                    form.setFieldValue('screenRandom', false);
                  }}
                />
              </Form.Item>
            </>
          )}

          <Form.Item label={t('album.type')} name="type">
            <Radio.Group
              disabled={props.mode === FormMode.Update}
              options={[
                {
                  label: t('album.type.directory'),
                  value: AlbumType.Directory,
                },
                { label: t('album.type.files'), value: AlbumType.Files },
              ]}
            />
          </Form.Item>

          <Form.Item noStyle dependencies={['type']}>
            {({ getFieldValue }) => {
              const type: AlbumType = getFieldValue('type');
              switch (type) {
                case AlbumType.Directory:
                  return (
                    <Form.Item
                      label={t('album.dir')}
                      name="dir"
                      rules={[{ required: true }]}
                    >
                      <Input.Search
                        className="form-item-input"
                        readOnly
                        enterButton={
                          <Button type="primary">{t('choose')}</Button>
                        }
                        onSearch={async () => {
                          const file = await open({
                            multiple: false,
                            directory: true,
                          });
                          if (!file) return;
                          form.setFieldsValue({
                            dir: file,
                          });
                        }}
                      />
                    </Form.Item>
                  );
                case AlbumType.Files:
                  return (
                    <Form.Item noStyle dependencies={['wallpaperType']}>
                      {({ getFieldValue }) => {
                        const wallpaperType: WallpaperType =
                          getFieldValue('wallpaperType');
                        return (
                          <Form.Item
                            label={t('album.paths')}
                            name="paths"
                            rules={[{ required: true }]}
                          >
                            <AlbumFileList wallpaperType={wallpaperType} />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  );
              }
            }}
          </Form.Item>
        </>
      </Form>
    </Modal>
  );
};

export default AlbumModal;
