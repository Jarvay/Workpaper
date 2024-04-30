import React from 'react';
import type { TableProps } from 'antd';
import { Table } from 'antd';
import { AnyObject } from 'antd/es/_util/type';

const CenterTable = <T extends AnyObject>(props: TableProps<T>) => {
  if (Array.isArray(props.columns)) {
    props.columns.forEach((column) => {
      column.align = 'center';
    });
  }

  return <Table {...props} />;
};

export default CenterTable;
