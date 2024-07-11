import React, { useRef } from 'react';
import { Button, Input, InputProps, InputRef, Modal, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUpdateEffect } from 'ahooks';
import { ipcRenderer } from 'electron';
import { Events } from '../../../cross/enums';

export type ShortcutInputProps = Omit<InputProps, 'onChange'> & {
  onChange?: (value: string) => void;
};

const DISABLE_KEYS = ['+'];

const ShortcutInput: React.FC<ShortcutInputProps> = (props) => {
  const [shortcut, setShortcut] = React.useState<string>('');
  const [shortcutArray, setShortcutArray] = React.useState<string[]>([]);
  const [inputOpen, setInputOpen] = React.useState(false);

  const { t } = useTranslation();
  const inputRef = useRef<InputRef>();

  useUpdateEffect(() => {
    if (inputOpen) {
      ipcRenderer.invoke(Events.UnregisterGlobalShortcut);
      setShortcutArray([]);
    }
  }, [inputOpen]);

  useUpdateEffect(() => {
    setShortcut(shortcutArray.join('+'));
  }, [shortcutArray]);

  return (
    <>
      <Space>
        <span>{String(props.value)}</span>

        <Button
          onClick={() => {
            setShortcut('');
            setInputOpen(true);
          }}
        >
          {t('set')}
        </Button>
      </Space>

      <Modal
        title={t('set')}
        open={inputOpen}
        onOk={() => {
          props.onChange?.(shortcut);
          setInputOpen(false);
        }}
        okButtonProps={{
          disabled: !shortcut,
        }}
        onCancel={() => setInputOpen(false)}
        destroyOnClose
        afterOpenChange={(open) => {
          if (open) {
            inputRef.current?.focus();
          }
        }}
      >
        <Input
          autoFocus
          ref={(ref) => {
            if (ref) {
              inputRef.current = ref;
            }
          }}
          value={shortcut}
          onKeyDown={(event) => {
            console.log({
              event,
            });
            let key = event.code
              .replace('Key', '')
              .replace('Left', '')
              .replace('Right', '');
            if (DISABLE_KEYS.includes(key)) return;
            if (key.length === 1 && shortcutArray.some((k) => k.length === 1))
              return;

            if (shortcutArray.includes(key)) {
              return;
            }
            shortcutArray.push(key);
            setShortcutArray([...shortcutArray]);
          }}
          onKeyUp={() => {
            inputRef.current?.blur();
          }}
          onClick={() => {
            setShortcutArray([]);
          }}
        />
      </Modal>
    </>
  );
};

export default ShortcutInput;
