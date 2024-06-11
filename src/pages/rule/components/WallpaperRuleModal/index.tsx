import React, { useMemo, useState } from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  TimePicker,
} from 'antd';
import {
  Album,
  Marquee,
  ModalFormProps,
  Rule,
} from '../../../../../cross/interface';
import {
  RuleType,
  Events,
  FormMode,
  WallpaperDirection,
  WallpaperType,
} from '../../../../../cross/enums';
import { ipcRenderer } from 'electron';
import { useMount, useUpdateEffect } from 'ahooks';
import { ruleService } from '@/services/rule';
import { cloneDeep, omit } from 'lodash';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { albumService } from '@/services/album';
import { marqueeService } from '@/services/marquee';

export interface FormRule extends Rule {
  time: [Dayjs, Dayjs];
}

const WallpaperRuleModal: React.FC<
  ModalFormProps<Rule> & { weekdayId?: string | number }
> = (props) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [marquees, setMarquees] = useState<Marquee[]>([]);

  const [form] = Form.useForm<FormRule>();
  const albumId: Album['id'] = Form.useWatch('albumId', form);

  const album = useMemo(() => {
    return albums.find((a) => a.id === albumId);
  }, [albumId]);

  const { t } = useTranslation();

  function fetchOptions() {
    albumService.get().then((value) => {
      setAlbums(value);
    });

    marqueeService.get().then((value) => {
      setMarquees(value);
    });
  }

  async function doCreate() {
    try {
      const values = await form.validateFields();
      await ruleService.create({
        ...omit(values, ['time']),
        start: dayjs(values.time[0]).format('HH:mm'),
        end: dayjs(values.time[1]).format('HH:mm'),
        weekdayId: props.weekdayId,
      } as Rule);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = await form.validateFields();
      await ruleService.update({
        ...props.values,
        ...omit(values, ['time']),
        start: dayjs(values.time[0]).format('HH:mm'),
        end: dayjs(values.time[1]).format('HH:mm'),
      } as Rule);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  useMount(() => {
    fetchOptions();
  });

  useUpdateEffect(() => {
    if (props.open) {
      form.resetFields();
      if (props.values) {
        const values: any = cloneDeep(props.values);
        values.time = [
          dayjs(`2001-01-01 ${values.start}`),
          dayjs(`2001-01-01 ${values.end}`),
        ];
        form.setFieldsValue({
          ...(values || {}),
        });
      }
    }
  }, [props.open]);

  function renderPathItem(path: string, wallpaperType: WallpaperType) {
    if (!path) return null;
    const size = 72;
    let children = null;
    switch (wallpaperType) {
      case WallpaperType.Image:
        children = (
          <Image
            style={{
              objectFit: 'contain',
            }}
            width={size}
            height={size}
            src={`file://${path}`}
          />
        );
        break;
      case WallpaperType.Video:
        children = (
          <video
            src={`file://${path}`}
            style={{
              width: `${size}px`,
              maxHeight: `${size}px`,
            }}
          />
        );
        break;
    }

    return (
      <div
        className="flex-center"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '1px solid #ccc',
        }}
      >
        {children}
      </div>
    );
  }

  function renderPathsOrPath(type: RuleType) {
    switch (type) {
      case RuleType.Fixed:
        return (
          <>
            <Form.Item label={t('rule.wallpaperType')} name="wallpaperType">
              <Radio.Group
                options={[
                  {
                    label: t('rule.wallpaperType.image'),
                    value: WallpaperType.Image,
                  },
                  {
                    label: t('rule.wallpaperType.video'),
                    value: WallpaperType.Video,
                  },
                ]}
                onChange={() => {
                  form.setFieldValue('paths', [undefined]);
                }}
              />
            </Form.Item>

            <Form.Item
              noStyle
              dependencies={['paths', 'type', 'wallpaperType']}
            >
              {({ getFieldValue }) => {
                const paths = getFieldValue('paths');
                const wallpaperType: WallpaperType =
                  getFieldValue('wallpaperType');
                return (
                  <Form.List
                    name="paths"
                    rules={[
                      {
                        validator: async (_, names) => {},
                      },
                    ]}
                  >
                    {(fields, { add, remove }, { errors }) => (
                      <>
                        {fields.map((field, index) => (
                          <Form.Item
                            label={t('rule.screen') + (index + 1)}
                            required={index === 0}
                            key={field.key}
                          >
                            <Form.Item
                              {...omit(field, ['key'])}
                              validateTrigger={['onChange', 'onBlur']}
                              rules={[
                                {
                                  required: true,
                                  message: t('rule.paths.requiredMessage'),
                                },
                              ]}
                              noStyle
                            >
                              <Space>
                                {renderPathItem(paths?.[index], wallpaperType)}

                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={async () => {
                                    const { paths } =
                                      form.getFieldsValue() as Rule;
                                    const event =
                                      wallpaperType === WallpaperType.Image
                                        ? Events.SelectImage
                                        : Events.SelectVideo;
                                    const files =
                                      await ipcRenderer.invoke(event);
                                    if (!files) return;
                                    paths[index] = files?.[0];
                                    form.setFieldsValue({
                                      paths,
                                    });
                                    await form.validateFields();
                                  }}
                                >
                                  {t('choose')}
                                </Button>

                                {index === 0 && (
                                  <Button
                                    type="dashed"
                                    size="small"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                  >
                                    {t('rule.addScreen')}
                                  </Button>
                                )}

                                {fields.length > 1 ? (
                                  <MinusCircleOutlined
                                    onClick={() => remove(field.name)}
                                  />
                                ) : null}
                              </Space>
                            </Form.Item>
                          </Form.Item>
                        ))}
                      </>
                    )}
                  </Form.List>
                );
              }}
            </Form.Item>
          </>
        );
      case RuleType.Marquee:
        return (
          <Form.Item
            label={t('rule.marquee')}
            name="marqueeId"
            rules={[{ required: true }]}
          >
            <Select
              className="form-item-input"
              options={marquees.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </Form.Item>
        );
      case RuleType.Album:
        return (
          <Form.Item
            label={t('rule.album')}
            name="albumId"
            rules={[{ required: true }]}
          >
            <Select
              className="form-item-input"
              options={albums.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />
          </Form.Item>
        );
    }
  }

  return (
    <Modal
      title={t('rule.timeSlot')}
      width="40%"
      style={{
        minWidth: '720px',
      }}
      {...(props.modalProps || {})}
      open={props.open}
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
    >
      <Form<Rule>
        form={form}
        labelCol={{ span: 5 }}
        labelWrap
        initialValues={
          {
            wallpaperType: WallpaperType.Image,
            type: RuleType.Fixed,
            interval: 60,
            days: [1, 2, 3, 4, 5, 6, 7],
            isRandom: false,
            screenRandom: false,
            paths: [''],
            column: 3,
          } as Partial<Rule>
        }
      >
        <Form.Item
          label={t('rule.timeSlot')}
          name="time"
          rules={[
            { required: true },
            {
              validator: (rule, value) => {
                return new Promise<void>(async (resolve, reject) => {
                  if (!value) {
                    return resolve();
                  }
                  const [startDayjs, endDayjs]: [dayjs.Dayjs, dayjs.Dayjs] =
                    value;
                  const start = startDayjs.format('HH:mm');
                  const end = endDayjs.format('HH:mm');
                  const isConflicts = await ruleService.isConflicts(
                    start,
                    end,
                    props.values?.weekdayId as string,
                    props.values?.id as string,
                  );
                  if (isConflicts) {
                    reject(new Error(t('rule.errMsg.interval.conflicts')));
                  }
                  resolve();
                });
              },
              validateTrigger: ['onBlur', 'onChange'],
            },
          ]}
        >
          <TimePicker.RangePicker
            rootClassName="form-item-input"
            format="HH:mm"
          />
        </Form.Item>

        <Form.Item
          label={t('rule.type')}
          name="type"
          rules={[{ required: true }]}
        >
          <Radio.Group
            onChange={(e) => {
              form.setFieldsValue({
                paths: [''],
                isRandom: false,
                screenRandom: false,
                albumId: '',
              });
            }}
            options={[
              { label: t('rule.type.fixed'), value: RuleType.Fixed },
              {
                label: t('rule.type.autoChange'),
                value: RuleType.Album,
              },
              {
                label: t('rule.type.marquee'),
                value: RuleType.Marquee,
              },
            ]}
          />
        </Form.Item>

        <Form.Item noStyle dependencies={['type', 'isRandom']}>
          {({ getFieldsValue }) => {
            const { type } = getFieldsValue() as Rule;
            const showIntervalAndRandom = type === RuleType.Album;
            const isVertical = WallpaperDirection.Vertical === album?.direction;

            console.log({
              album,
            });

            return (
              <>
                {renderPathsOrPath(type)}

                {showIntervalAndRandom && (
                  <>
                    {isVertical &&
                      album?.wallpaperType === WallpaperType.Image && (
                        <Form.Item
                          label={t('rule.column')}
                          name="column"
                          rules={[{ required: true }]}
                        >
                          <InputNumber />
                        </Form.Item>
                      )}

                    {(!isVertical ||
                      album?.wallpaperType === WallpaperType.Video) && (
                      <Form.Item label={t('rule.isRandom')} name="isRandom">
                        <Switch
                          onChange={() => {
                            form.setFieldValue('screenRandom', false);
                          }}
                        />
                      </Form.Item>
                    )}

                    <Form.Item noStyle dependencies={['isRandom']}>
                      {({ getFieldValue }) => {
                        const isRandom = getFieldValue('isRandom');
                        const isVertical =
                          WallpaperDirection.Vertical === album?.direction;
                        return (
                          isRandom &&
                          !isVertical &&
                          album?.wallpaperType === WallpaperType.Image && (
                            <Form.Item
                              label={t('rule.screenRandom')}
                              name="screenRandom"
                            >
                              <Switch />
                            </Form.Item>
                          )
                        );
                      }}
                    </Form.Item>

                    {album?.wallpaperType === WallpaperType.Image && (
                      <Form.Item
                        label={t('rule.interval')}
                        name="interval"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={5} max={24 * 60} />
                      </Form.Item>
                    )}
                  </>
                )}
              </>
            );
          }}
        </Form.Item>

        <Form.Item label={t('rule.remark')} name="remark">
          <Input className="form-item-input" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WallpaperRuleModal;
