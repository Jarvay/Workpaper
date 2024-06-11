import React, { useRef } from 'react';
import styles from '@/pages/wallpaper/static/index.module.less';
import { Carousel, CarouselProps } from 'antd';
import { CarouselRef } from 'antd/es/carousel';

export interface CarouselIndex {
  current: number;
  next: number;
}
export interface ImageCarouselProps {
  paths: string[];
  imgStyle?: React.CSSProperties;
  onImgLoad?: (index: number) => Promise<void> | void;
  carouselIndex: CarouselIndex;
  carouselProps?: CarouselProps;
}

const SPEED = 1500;
const HorizontalImageCarousel: React.FC<ImageCarouselProps> = (props) => {
  const { carouselIndex } = props;

  const carouselRef = useRef<CarouselRef>();

  return (
    <Carousel
      dots={false}
      fade
      speed={SPEED}
      ref={(ref) => {
        if (ref) {
          carouselRef.current = ref;
        }
      }}
      {...(props.carouselProps || {})}
    >
      {props.paths.map((item, index) => {
        const showImg =
          carouselIndex.current === index || carouselIndex.next === index;
        return showImg ? (
          <div key={item}>
            <img
              alt=""
              src={`file://${item}`}
              className={[styles.wallpaper].join(' ')}
              style={props.imgStyle}
              onLoad={() => {
                carouselRef.current?.goTo(index, false);
                props.onImgLoad?.(index);
              }}
            />
          </div>
        ) : (
          <span key={item} />
        );
      })}
    </Carousel>
  );
};

export default HorizontalImageCarousel;
