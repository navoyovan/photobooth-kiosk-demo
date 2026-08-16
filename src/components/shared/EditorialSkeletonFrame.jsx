import React, { useState } from 'react';
import { getFrameLayout } from '../../constants/frame_layouts';
import styles from './EditorialSkeletonFrame.module.css';

const SLOT_COLORS = [
  '#FF3E3E', '#FF8E3E', '#FFD43E', '#C5FF3E', 
  '#3EFF8E', '#3EFFD4', '#3EABFF', '#3E4BFF',
  '#8E3EFF', '#D43EFF', '#FF3ED4', '#FF3E8E'
];

function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(240, 96, 13, ${alpha})`;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(240, 96, 13, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

const EditorialSkeletonFrame = ({ src, alt, isComingSoon = false, frame = null, showHoles = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(3 / 4); // Start 3:4 vertical as requested

  const handleLoad = (e) => {
    if (e.target.naturalWidth && e.target.naturalHeight) {
      setAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
    }
    setIsLoaded(true);
  };

  const layout = frame && showHoles ? getFrameLayout(frame) : [];

  return (
    <div
      className={styles.wrapper}
      style={{ aspectRatio: `${aspectRatio}` }}
    >
      {/* Animated Checkerboard Cutouts underneath frame image */}
      {showHoles && isLoaded && !isComingSoon && (
        <>
          <div className={styles.thumbCheckerboardBg} />
          {Array.isArray(layout) && layout.map((slot, idx) => {
            const slotColor = slot.color || SLOT_COLORS[idx % SLOT_COLORS.length] || '#ffc832';
            const c1 = hexToRgba(slotColor, 0.35);
            const c2 = '#ffffff';

            return (
              <div
                key={`slot-bg-${slot.id ?? idx}`}
                className={styles.slotCheckerboardCutoutAnimated}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  backgroundColor: c2,
                  backgroundImage: `conic-gradient(${c1} 90deg, transparent 90deg 180deg, ${c1} 180deg 270deg, transparent 270deg)`,
                  backgroundSize: '12px 12px',
                }}
              >
                {slot.type === 'svg' && slot.path && (
                  <svg
                    viewBox={`${slot.x} ${slot.y} ${slot.w} ${slot.h}`}
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  >
                    <path d={slot.path} fill={hexToRgba(slotColor, 0.3)} stroke={slotColor} strokeWidth="1" />
                  </svg>
                )}
              </div>
            );
          })}
        </>
      )}

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
