import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import styles from './index.module.less';

interface ImageWithTransitionProps {
  path: string;
  alt?: string;
  className?: string;
  transitionDuration?: number;
  onLoad?: () => void;
  onError?: () => void;
  imgStyle?: CSSProperties;
}

const ImageWithTransition: React.FC<ImageWithTransitionProps> = ({
  path,
  alt = '',
  className = '',
  transitionDuration = 500,
  onLoad,
  onError,
  imgStyle = {},
}) => {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentImageRef = useRef<HTMLImageElement>(null);
  const nextImageRef = useRef<HTMLImageElement>(null);

  const preloadImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        onLoad?.();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(true);
          });
        });
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  useEffect(() => {
    if (!path) return;

    if (!currentImage) {
      setCurrentImage(path);
      return;
    }

    const startTransition = async () => {
      setIsTransitioning(true);

      const isLoaded = await preloadImage(path);

      if (!isLoaded) {
        setIsTransitioning(false);
        onError?.();
        return;
      }

      setNextImage(path);
    };

    startTransition();
  }, [path, currentImage, onError]);

  useEffect(() => {
    if (!nextImage || !isTransitioning) return;
    if (!nextImageRef.current) return;

    requestAnimationFrame(() => {
      if (nextImageRef.current) {
        nextImageRef.current.style.opacity = '1';
      }
    });

    const timer = setTimeout(() => {
      setCurrentImage(nextImage);
      setNextImage(null);
      setIsTransitioning(false);
      onLoad?.();
    }, transitionDuration);

    return () => clearTimeout(timer);
  }, [nextImage, isTransitioning, transitionDuration, onLoad]);

  const containerClass = `${styles.imageContainer} ${className}`;

  return (
    <div
      ref={containerRef}
      className={containerClass}
      style={
        { '--transition-duration': `${transitionDuration}ms` } as CSSProperties
      }
    >
      {currentImage && (
        <img
          ref={currentImageRef}
          src={currentImage}
          alt={alt}
          className={`${styles.image} ${styles.currentImage}`}
          style={{ opacity: 1, ...imgStyle }}
        />
      )}

      {isTransitioning && nextImage && (
        <img
          ref={nextImageRef}
          src={nextImage}
          alt={alt}
          className={`${styles.image} ${styles.nextImage}`}
          style={{ opacity: 0, ...imgStyle }}
        />
      )}
    </div>
  );
};

export default ImageWithTransition;
