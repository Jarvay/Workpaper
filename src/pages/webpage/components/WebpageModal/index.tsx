import React from 'react';
import { ModalFormProps, Webpage } from '../../../../../cross/interface';
import { Form, Input, message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { FormMode } from '../../../../../cross/enums';
import { useUpdateEffect } from 'ahooks';
import { webpageService } from '@/services/webpage';

export type WebpageModalProps = ModalFormProps<Webpage> & {};

const WebpageModal: React.FC<WebpageModalProps> = (props) => {
  const [form] = Form.useForm<Webpage>();

  const { t } = useTranslation();

  async function doCreate() {
    try {
      const values = await form.validateFields();
      await webpageService.create(values as Webpage);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = await form.validateFields();
      await webpageService.update({
        ...props.values,
        ...values,
      } as Webpage);
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

  return (
    <Modal
      {...(props.modalProps || {})}
      title={t('webpage')}
      open={props.open}
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
    >
      <Form<Webpage> form={form} labelCol={{ span: 4 }}>
        <Form.Item
          label={t('webpage.name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('webpage.url')}
          name="url"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default WebpageModal;
