import React from 'react';
import { Album, ModalFormProps } from '../../../../../cross/interface';
import {
  Button,
  ColorPicker,
  ColorPickerProps,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AlbumType,
  Events,
  FormMode,
  WallpaperDirection,
  WallpaperType,
} from '../../../../../cross/enums';
import { albumService } from '@/services/album';
import { ipcRenderer } from 'electron';
import { useUpdateEffect } from 'ahooks';
import AlbumFileList from '@/pages/album/components/AlbumFileList';
import { ColorFactory } from 'antd/es/color-picker/color';
import { DEFAULT_MARQUEE } from '../../../../../cross/consts';

export interface AlbumModalProps extends ModalFormProps<Album> {}

const AlbumModal: React.FC<AlbumModalProps> = (props) => {
  const [form] = Form.useForm<Album>();
  const wallpaperType: WallpaperType = Form.useWatch('wallpaperType', form);

  const { t } = useTranslation();

  function getHexString(value: ColorPickerProps['value']) {
    if (!value) {
      throw new Error('type of value is not right');
    }
    if (typeof value === 'string') {
      return new ColorFactory(value).toHexString();
    }

    return value.toHexString();
  }

  function transformValues(values: Record<string, any> & Album) {
    if (values.wallpaperType === WallpaperType.Marquee) {
      values = {
        ...values,
        textColor: getHexString(values.textColor),
        backgroundColor: getHexString(values.backgroundColor),
      };
    }

    return values;
  }

  async function doCreate() {
    try {
      const values = transformValues(await form.validateFields());
      await albumService.create(values as Album);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = transformValues(await form.validateFields());
      await albumService.update({
        ...props.values,
        ...values,
      } as Album);
      message.success(t('operationSuccess'));
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

  function renderWallpaperTypeFormContent() {
    switch (wallpaperType) {
      default:
      case WallpaperType.Image:
      case WallpaperType.Video:
        return (
          <>
            {wallpaperType === WallpaperType.Image && (
              <>
                <Form.Item label={t('album.direction')} name="direction">
                  <Radio.Group
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

                <Form.Item dependencies={['direction']} noStyle>
                  {({ getFieldValue }) => {
                    const direction = getFieldValue('direction');
                    const isVertical =
                      WallpaperDirection.Vertical === direction;
                    return (
                      isVertical && (
                        <Form.Item
                          label={t('rule.column')}
                          name="column"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={1} precision={0} step={1} />
                        </Form.Item>
                      )
                    );
                  }}
                </Form.Item>
              </>
            )}

            <Form.Item label={t('album.type')} name="type">
              <Radio.Group
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
                            const file = await ipcRenderer.invoke(
                              Events.SelectDir,
                            );
                            form.setFieldsValue({
                              dir: file?.[0],
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
                            <Form.Item label={t('album.paths')} name="paths">
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
        );
      case WallpaperType.Marquee:
        return (
          <>
            <Form.Item
              label={t('album.wallpaperType.marquee.text')}
              name="text"
              rules={[{ required: true }]}
            >
              <Input className="form-item-input" />
            </Form.Item>

            <Form.Item
              label={t('album.wallpaperType.marquee.textColor')}
              name="textColor"
              rules={[{ required: true }]}
            >
              <ColorPicker showText defaultFormat="hex" disabledAlpha />
            </Form.Item>

            <Form.Item
              label={t('album.wallpaperType.marquee.backgroundColor')}
              name="backgroundColor"
              rules={[{ required: true }]}
            >
              <ColorPicker showText defaultFormat="hex" disabledAlpha />
            </Form.Item>

            <Form.Item
              label={t('album.wallpaperType.marquee.fontSize')}
              name="fontSize"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} step={1} precision={0} />
            </Form.Item>

            <Form.Item
              label={t('album.wallpaperType.marquee.letterSpacing')}
              name="letterSpacing"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} step={1} precision={0} />
            </Form.Item>

            <Form.Item
              label={t('album.wallpaperType.marquee.speed')}
              name="speed"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} step={1} precision={0} />
            </Form.Item>
          </>
        );
    }
  }

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
            ...DEFAULT_MARQUEE,
            column: 3,
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
            onChange={(e) => {
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
              {
                label: t('album.wallpaperType.marquee'),
                value: WallpaperType.Marquee,
              },
            ]}
          />
        </Form.Item>

        {renderWallpaperTypeFormContent()}
      </Form>
    </Modal>
  );
};

export default AlbumModal;
