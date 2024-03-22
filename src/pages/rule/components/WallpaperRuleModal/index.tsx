import React from 'react';
import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Switch,
  TimePicker,
} from 'antd';
import {
  ModalFormProps,
  Rule,
  TranslationFunc,
} from '../../../../../cross/interface';
import {
  ChangeType,
  Events,
  FormMode,
  WallpaperType,
} from '../../../../../cross/enums';
import { ipcRenderer } from 'electron';
import { useUpdateEffect } from 'ahooks';
import { ruleService } from '@/services/rule';
import { cloneDeep, omit } from 'lodash';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

const WallpaperRuleModal: React.FC<
  ModalFormProps<Rule> & { weekdayId?: string | number }
> = (props) => {
  const [form] = Form.useForm();

  const { t }: { t: TranslationFunc } = useTranslation();

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
  }, [props.open, props.values]);

  return (
    <Modal
      title={t('rule.timeSlot')}
      style={{
        minWidth: '700px',
      }}
      width="60%"
      {...props}
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
        labelCol={{ span: 4 }}
        labelWrap
        initialValues={
          {
            wallpaperType: WallpaperType.Image,
            type: ChangeType.Fixed,
            interval: 60,
            days: [1, 2, 3, 4, 5, 6, 7],
            isRandom: false,
            screenRandom: false,
            paths: [''],
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
          <TimePicker.RangePicker format="HH:mm" />
        </Form.Item>

        <Form.Item
          label={t('rule.wallpaperType')}
          name="wallpaperType"
          rules={[{ required: true }]}
        >
          <Radio.Group
            onChange={(e) => {
              if (e.target.value === WallpaperType.Video) {
                form.setFieldsValue({
                  path: undefined,
                  paths: [undefined],
                });
              }
            }}
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
                path: undefined,
                paths: [undefined],
              });
            }}
            options={[
              { label: t('rule.type.fixed'), value: ChangeType.Fixed },
              {
                label: t('rule.type.autoChange'),
                value: ChangeType.AutoChange,
              },
            ]}
          />
        </Form.Item>

        <Form.Item noStyle dependencies={['type']}>
          {({ getFieldsValue }) => {
            const { type } = getFieldsValue() as Rule;
            switch (type) {
              case ChangeType.Fixed:
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
                              {...field}
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
                                <Form.Item dependencies={['paths']} noStyle>
                                  {({ getFieldsValue }) => {
                                    const { paths, wallpaperType } =
                                      getFieldsValue() as Rule;
                                    if (!paths?.[index]) return null;
                                    switch (wallpaperType) {
                                      case WallpaperType.Image:
                                        return (
                                          <Image
                                            width={128}
                                            height={128}
                                            src={`file://${paths[index]}`}
                                          />
                                        );
                                      case WallpaperType.Video:
                                        return (
                                          <video
                                            src={`file://${paths[index]}`}
                                            style={{
                                              width: '128px',
                                              maxHeight: '128px',
                                            }}
                                          />
                                        );
                                    }
                                  }}
                                </Form.Item>

                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={async () => {
                                    const { paths, wallpaperType } =
                                      form.getFieldsValue() as Rule;
                                    const event =
                                      wallpaperType === WallpaperType.Image
                                        ? Events.SelectImage
                                        : Events.SelectVideo;
                                    const file =
                                      await ipcRenderer.invoke(event);
                                    paths[index] = file?.[0];
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
              case ChangeType.AutoChange:
                return (
                  <Form.Item
                    label={t('rule.path')}
                    name="path"
                    rules={[{ required: true }]}
                  >
                    <Input.Search
                      style={{ width: '70%' }}
                      readOnly
                      enterButton={
                        <Button type="primary">{t('choose')}</Button>
                      }
                      onSearch={async () => {
                        const type: ChangeType = form.getFieldValue('type');
                        const wallpaperType: WallpaperType =
                          form.getFieldValue('wallpaperType');

                        const event =
                          wallpaperType === WallpaperType.Image
                            ? Events.SelectImage
                            : Events.SelectVideo;
                        if (type === ChangeType.Fixed) {
                          const file = await ipcRenderer.invoke(event);
                          form.setFieldsValue({
                            path: file?.[0],
                          });
                        } else {
                          const file = await ipcRenderer.invoke(
                            Events.SelectDir,
                          );
                          form.setFieldsValue({
                            path: file?.[0],
                          });
                        }
                      }}
                    />
                  </Form.Item>
                );
            }
          }}
        </Form.Item>

        <Form.Item noStyle dependencies={['type', 'wallpaperType']}>
          {({ getFieldsValue }) => {
            const { type, wallpaperType } = getFieldsValue() as Rule;
            const show =
              type === ChangeType.AutoChange &&
              wallpaperType === WallpaperType.Image;
            if (show) {
              return (
                <>
                  <Form.Item
                    label={t('rule.interval')}
                    name="interval"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={10} max={24 * 60} />
                  </Form.Item>

                  <Form.Item label={t('rule.isRandom')} name="isRandom">
                    <Switch />
                  </Form.Item>
                </>
              );
            } else {
              return null;
            }
          }}
        </Form.Item>

        <Form.Item noStyle dependencies={['isRandom']}>
          {({ getFieldsValue }) => {
            const { isRandom, type, wallpaperType } = getFieldsValue() as Rule;
            return wallpaperType === WallpaperType.Image &&
              type === ChangeType.AutoChange &&
              isRandom ? (
              <>
                <Form.Item label={t('rule.screenRandom')} name="screenRandom">
                  <Switch />
                </Form.Item>
              </>
            ) : null;
          }}
        </Form.Item>

        <Form.Item label={t('rule.remark')} name="remark">
          <Input style={{ width: '70%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WallpaperRuleModal;
