import React, { useState } from 'react';
import { assetUrl } from '../../utils/assetUrl';

const ThumbnailOrFallback = React.memo(({ src, alt, slots = 1 }) => {
  const [failed, setFailed] = useState(false);
  const isCollage = slots > 1;

  // If the image failed or we specifically want a skeleton for empty collages
  if (failed) {
    return (
      <div className="thumb-wrapper">
        <img src={assetUrl('thumbnail/00.png')} alt="Fallback" className="thumb-img" />
      </div>
    );
  }

  // If it's a collage and we have no src, show skeleton
  if (isCollage && !src) {
    return (
      <div className={`thumb-fallback collage-skeleton slots-${slots}`}>
        <div className="skeleton-grid">
          {Array.from({ length: slots }).map((_, i) => (
            <div key={i} className="skeleton-slot" />
          ))}
        </div>
        <div className="collage-badge">COLLAGE_LAYOUT</div>
      </div>
    );
  }

  return (
    <div className="thumb-wrapper">
      <img
        src={src || assetUrl('thumbnail/00.png')}
        alt={alt}
        className="thumb-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
});

export default ThumbnailOrFallback;
