import React from 'react';
import {
  ModalFormProps,
  TranslationFunc,
  WallpaperWebsite,
} from '../../../../../cross/interface';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  FormMode,
  WallpaperWebsiteRequestParamType,
  WallpaperWebsiteType,
  WebsitePlaceholder,
} from '../../../../../cross/enums';
import styles from './index.module.less';
import { websiteService } from '@/services/website';
import { useUpdateEffect } from 'ahooks';
import { MinusCircleOutlined } from '@ant-design/icons';

export interface WallpaperWebsiteModalProps
  extends ModalFormProps<WallpaperWebsite> {}

const WallpaperWebsiteModal: React.FC<WallpaperWebsiteModalProps> = (props) => {
  const [form] = Form.useForm();

  const t = useTranslation().t as TranslationFunc;

  async function doCreate() {
    try {
      const values = await form.validateFields();
      await websiteService.create({
        ...values,
      } as WallpaperWebsite);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = await form.validateFields();
      await websiteService.update({
        ...values,
        id: props.values?.id,
      } as WallpaperWebsite);
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

  function renderApiFormItems() {
    return (
      <>
        <Form.Item
          label={t('lib.request.url')}
          name={['request', 'url']}
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('lib.request.method')}
          name={['request', 'method']}
          rules={[{ required: true }]}
        >
          <Select
            className="form-item-input"
            options={[
              { label: 'POST', value: 'POST' },
              { label: 'GET', value: 'GET' },
            ]}
          />
        </Form.Item>

        <Form.List name={['request', 'params']}>
          {(fields, operation, meta) => {
            return (
              <Form.Item label={t('lib.request.params')}>
                <div className={`${styles.requestParamsList}`}>
                  {fields.map((field, index) => (
                    <React.Fragment key={field.key}>
                      <Row gutter={8} align="middle">
                        <Col span={7}>
                          <Form.Item
                            labelCol={{ span: 7 }}
                            label={t('lib.request.params.key')}
                            name={[field.name, 'key']}
                            rules={[{ required: true }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>

                        <Col span={7}>
                          <Form.Item
                            dependencies={[
                              ['request', 'params', index, 'type'],
                            ]}
                            noStyle
                          >
                            {({ getFieldValue }) => {
                              const request = getFieldValue(
                                'request',
                              ) as WallpaperWebsite['request'];

                              const { type } = request.params[index];
                              return (
                                <Form.Item
                                  {...field}
                                  labelCol={{ span: 7 }}
                                  label={t('lib.request.params.value')}
                                  name={[field.name, 'value']}
                                  rules={[{ required: true }]}
                                >
                                  {renderParamItem(type)}
                                </Form.Item>
                              );
                            }}
                          </Form.Item>
                        </Col>

                        <Col span={7}>
                          <Form.Item
                            {...field}
                            labelCol={{ span: 9 }}
                            label={t('lib.request.params.type')}
                            name={[field.name, 'type']}
                            rules={[{ required: true }]}
                          >
                            <Select
                              options={[
                                {
                                  label: t(
                                    'lib.request.params.type.placeholder',
                                  ),
                                  value:
                                    WallpaperWebsiteRequestParamType.Placeholder,
                                },
                                {
                                  label: t('lib.request.params.type.string'),
                                  value:
                                    WallpaperWebsiteRequestParamType.String,
                                },
                                {
                                  label: t('lib.request.params.type.number'),
                                  value:
                                    WallpaperWebsiteRequestParamType.Number,
                                },
                              ]}
                              onChange={() => {
                                form.setFieldValue(
                                  ['request', 'params', index, 'value'],
                                  undefined,
                                );
                              }}
                            />
                          </Form.Item>
                        </Col>

                        <Col span={3}>
                          <Form.Item>
                            <MinusCircleOutlined
                              onClick={() => operation.remove(field.name)}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </React.Fragment>
                  ))}
                </div>

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() =>
                      operation.add({
                        type: WallpaperWebsiteRequestParamType.String,
                      })
                    }
                  >
                    {t('add')}
                  </Button>
                </Form.Item>
              </Form.Item>
            );
          }}
        </Form.List>

        <Form.Item
          label={t('lib.responseKey.list')}
          name={['responseKey', 'list']}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('lib.responseKey.originInItem')}
          name={['responseKey', 'rawInItem']}
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('lib.responseKey.thumbInItem')}
          name={['responseKey', 'thumbInItem']}
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>
      </>
    );
  }

  function renderParamItem(type: WallpaperWebsiteRequestParamType) {
    switch (type) {
      case WallpaperWebsiteRequestParamType.Placeholder:
        return (
          <Select
            options={[
              {
                label: t('lib.request.params.placeholder.currentCount'),
                value: WebsitePlaceholder.CurrentCount,
              },
              {
                label: t('lib.request.params.placeholder.page'),
                value: WebsitePlaceholder.Page,
              },
              {
                label: t('lib.request.params.placeholder.pageSize'),
                value: WebsitePlaceholder.PageSize,
              },
            ]}
          />
        );
      case WallpaperWebsiteRequestParamType.Number:
        return <InputNumber />;
      case WallpaperWebsiteRequestParamType.String:
        return <Input />;
    }
  }

  return (
    <Modal
      {...(props.modalProps || {})}
      open={props.open}
      title={t('lib.wallpaperLib')}
      width="50%"
      style={{
        minWidth: '600px',
      }}
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
    >
      <Form<WallpaperWebsite>
        form={form}
        labelCol={{
          span: 4,
        }}
        initialValues={{
          type: WallpaperWebsiteType.Website,
        }}
      >
        <Form.Item
          label={t('lib.name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('lib.type')}
          name="type"
          rules={[{ required: true }]}
        >
          <Radio.Group
            options={[
              {
                label: t('lib.type.website'),
                value: WallpaperWebsiteType.Website,
              },
              { label: t('lib.type.api'), value: WallpaperWebsiteType.Api },
            ]}
          />
        </Form.Item>

        <Form.Item dependencies={['type']} noStyle>
          {({ getFieldsValue }) => {
            const { type } = getFieldsValue() as WallpaperWebsite;
            switch (type) {
              case WallpaperWebsiteType.Website:
                return (
                  <Form.Item
                    label={t('lib.request.url')}
                    name="url"
                    rules={[{ required: true }]}
                  >
                    <Input className="form-item-input" />
                  </Form.Item>
                );
              case WallpaperWebsiteType.Api:
                return renderApiFormItems();
            }
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WallpaperWebsiteModal;
