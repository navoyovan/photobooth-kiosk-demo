import React, { useState } from 'react';
import styles from './EditorialSkeletonFrame.module.css';

const EditorialSkeleton = ({ isComingSoon = false }) => {
  return (
    <div className={styles.blueprint}>
      <div className={`${styles.cropMark} ${styles.cmTl}`} />
      <div className={`${styles.cropMark} ${styles.cmTr}`} />
      <div className={`${styles.cropMark} ${styles.cmBl}`} />
      <div className={`${styles.cropMark} ${styles.cmBr}`} />
      <div className={styles.centerCrosshair} />
      {isComingSoon && <div className={styles.comingSoon}>coming soon</div>}
    </div>
  );
};

const EditorialSkeletonFrame = ({ src, alt, isComingSoon = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(3 / 4); // Start 3:4 vertical as requested

  const handleLoad = (e) => {
    if (e.target.naturalWidth && e.target.naturalHeight) {
      setAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
    }
    setIsLoaded(true);
  };

  return (
    <div
      className={styles.wrapper}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {!isComingSoon && src && (
        <img
          src={src}
          alt={alt}
          className={`${styles.img} ${isLoaded ? styles.loaded : ''}`}
          onLoad={handleLoad}
        />
      )}
      {(!isLoaded || isComingSoon) && <EditorialSkeleton isComingSoon={isComingSoon} />}
    </div>
  );
};

export default EditorialSkeletonFrame;
