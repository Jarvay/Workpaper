import React from 'react';
import { Marquee, ModalFormProps } from '../../../../../cross/interface';
import {
  ColorPicker,
  ColorPickerProps,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { FormMode, WallpaperType } from '../../../../../cross/enums';
import { useUpdateEffect } from 'ahooks';
import { ColorFactory } from 'antd/es/color-picker/color';
import { DEFAULT_MARQUEE } from '../../../../../cross/consts';
import { marqueeService } from '@/services/marquee';

export type MarqueeModalProps = ModalFormProps<Marquee> & {};

const MarqueeModal: React.FC<MarqueeModalProps> = (props) => {
  const [form] = Form.useForm<Marquee>();

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

  function transformValues(values: Record<string, any> & Marquee) {
    return {
      ...values,
      textColor: getHexString(values.textColor),
      backgroundColor: getHexString(values.backgroundColor),
    };
  }

  async function doCreate() {
    try {
      const values = transformValues(await form.validateFields());
      await marqueeService.create(values as Marquee);
      message.success(t('operationSuccess'));
      await props.onChange?.();
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = transformValues(await form.validateFields());
      await marqueeService.update({
        ...props.values,
        ...values,
      } as Marquee);
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
      title={t('marquee')}
      open={props.open}
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
    >
      <Form<Marquee>
        form={form}
        labelCol={{ span: 4 }}
        initialValues={
          {
            ...DEFAULT_MARQUEE,
          } as Partial<Marquee>
        }
      >
        <Form.Item
          label={t('marquee.name')}
          name="name"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('marquee.text')}
          name="text"
          rules={[{ required: true }]}
        >
          <Input className="form-item-input" />
        </Form.Item>

        <Form.Item
          label={t('marquee.textColor')}
          name="textColor"
          rules={[{ required: true }]}
        >
          <ColorPicker showText defaultFormat="hex" disabledAlpha />
        </Form.Item>

        <Form.Item
          label={t('marquee.backgroundColor')}
          name="backgroundColor"
          rules={[{ required: true }]}
        >
          <ColorPicker showText defaultFormat="hex" disabledAlpha />
        </Form.Item>

        <Form.Item
          label={t('marquee.fontSize')}
          name="fontSize"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} step={1} precision={0} />
        </Form.Item>

        <Form.Item
          label={t('marquee.letterSpacing')}
          name="letterSpacing"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} step={1} precision={0} />
        </Form.Item>

        <Form.Item
          label={t('marquee.speed')}
          name="speed"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} step={1} precision={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MarqueeModal;
