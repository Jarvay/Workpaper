import React, { useState } from 'react';
import { Image, ImageProps } from 'antd';
import { useMount } from 'ahooks';

export type LazyImageProps = ImageProps & {
  delay?: number;
};

const LazyImage: React.FC<LazyImageProps> = (props) => {
  const { src, ...others } = props;

  const [source, setSource] = useState<string>();

  useMount(() => {
    setTimeout(() => {
      setSource(src);
    }, props.delay || 150);
  });

  return <Image src={source} {...others} />;
};

export default LazyImage;
