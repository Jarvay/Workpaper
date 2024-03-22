import React, { ReactNode } from 'react';
import styles from './index.module.less';

export interface PageContainerProps {
  children?: React.JSX.Element | ReactNode;
}
const PageContainer: React.FC<PageContainerProps> = (props) => {
  return <div className={styles.appLayout}>{props.children}</div>;
};

export default PageContainer;
