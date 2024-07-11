import React from 'react';
import { useTranslation } from 'react-i18next';
import { DefaultOptionType } from 'rc-select/lib/Select';

export type WeekComponentProps = {
  children?: (
    weekMap: Map<number, string>,
    weekOptions: DefaultOptionType[],
  ) => React.ReactNode | JSX.Element;
};

const WeekComponent: React.FC<WeekComponentProps> = (props) => {
  const { t } = useTranslation();

  const weekMap = new Map([
    [1, t('monday')],
    [2, t('tuesday')],
    [3, t('wednesday')],
    [4, t('thursday')],
    [5, t('friday')],
    [6, t('saturday')],
    [7, t('sunday')],
  ]);

  const weekOptions: DefaultOptionType[] = [];
  weekMap.forEach((value, key, map) => {
    weekOptions.push({
      label: value,
      value: key,
    });
  });

  return props.children?.(weekMap, weekOptions) || null;
};

export default WeekComponent;
