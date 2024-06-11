import React from 'react';
import styles from './index.module.less';
import { CloseCircleOutlined } from '@ant-design/icons';

export interface ClosableBoxProps extends React.PropsWithChildren {
  onClose?: (event: React.MouseEvent<HTMLSpanElement>) => any;
}

const ClosableBox: React.FC<ClosableBoxProps> = (props) => {
  return (
    <div className={styles.closableBoxContainer}>
      {props.children}

      <CloseCircleOutlined
        className={styles.closeBtn}
        onClick={(event) => props.onClose?.(event)}
      />
    </div>
  );
};

export default ClosableBox;
