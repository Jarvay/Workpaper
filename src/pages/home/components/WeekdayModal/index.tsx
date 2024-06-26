import React, { useState } from 'react';
import { ModalFormProps, Weekday } from '../../../../../cross/interface';
import { Checkbox, Col, Form, message, Modal, Row } from 'antd';
import { useUpdateEffect } from 'ahooks';
import { FormMode } from '../../../../../cross/enums';
import { weekdayService } from '@/services/weekday';
import WeekComponent from '@/components/WeekComponent';
import { useTranslation } from 'react-i18next';

const WeekdayModal: React.FC<ModalFormProps> = (props) => {
  const [form] = Form.useForm();

  const [existDays, setExistDays] = useState<number[]>([]);

  const { t } = useTranslation();

  async function doCreate() {
    try {
      const values = await form.validateFields();
      await weekdayService.create({
        ...values,
      } as Weekday);
      await props.onChange?.();
      message.success(t('operationSuccess'));
    } catch (e) {
      console.warn(e);
    }
  }

  async function doUpdate() {
    try {
      const values = await form.validateFields();
      await weekdayService.update({
        ...props.values,
        ...values,
        id: props.values?.id,
      } as Weekday);
      await props.onChange?.();
      message.success(t('operationSuccess'));
    } catch (e) {
      console.warn(e);
    }
  }

  useUpdateEffect(() => {
    if (props.open) {
      form.resetFields();

      weekdayService.get().then((weekdays) => {
        const days: number[] = [];
        weekdays
          .filter((item) => item.id !== props.values?.id)
          .forEach((item) => {
            days.push(...item.days);
          });

        form.setFieldsValue({
          days: [1, 2, 3, 4, 5, 6, 7].filter((day) => !days.includes(day)),
          ...(props.values || {}),
        });
        setExistDays(days);
      });
    }
  }, [props.open]);

  return (
    <Modal
      onOk={async () => {
        if (props.mode === FormMode.Create) {
          await doCreate();
        } else {
          await doUpdate();
        }
      }}
      {...(props.modalProps || {})}
      open={props.open}
      title={t('selectPeriodTips')}
      width="200px"
    >
      <WeekComponent>
        {(weekMap, weekOptions) => {
          return (
            <Form form={form}>
              <Form.Item
                name="days"
                rules={[{ required: true, message: t('selectPeriodTips') }]}
              >
                <Checkbox.Group>
                  <Row>
                    {weekOptions.map((item) => (
                      <Col
                        style={{ marginTop: '16px' }}
                        span={24}
                        key={item.value}
                      >
                        <Checkbox
                          value={item.value}
                          disabled={existDays.includes(item.value as number)}
                        >
                          {item.label}
                        </Checkbox>
                      </Col>
                    ))}
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </Form>
          );
        }}
      </WeekComponent>
    </Modal>
  );
};

export default WeekdayModal;
