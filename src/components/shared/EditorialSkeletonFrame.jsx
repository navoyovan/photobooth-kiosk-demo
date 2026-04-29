import React, { useState } from 'react';

const EditorialSkeleton = ({ isComingSoon = false }) => {
  return (
    <div className="blueprint-skeleton">
      <div className="crop-mark cm-tl" />
      <div className="crop-mark cm-tr" />
      <div className="crop-mark cm-bl" />
      <div className="crop-mark cm-br" />
      <div className="center-crosshair" />
      {isComingSoon && <div className="label-coming-soon">coming soon</div>}
    </div>
  );
};

const EditorialSkeletonFrame = ({ src, alt, isComingSoon = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(3 / 4);

  const handleLoad = (e) => {
    if (e.target.naturalWidth && e.target.naturalHeight) {
      setAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
    }
    setIsLoaded(true);
  };

  return (
    <div
      className="editorial-frame-wrapper"
      style={{ aspectRatio: isLoaded ? `${aspectRatio}` : '3/4' }}
    >
      {!isComingSoon && src && (
        <img
          src={src}
          alt={alt}
          className={`editorial-img ${isLoaded ? 'is-loaded' : ''}`}
          onLoad={handleLoad}
        />
      )}
      {(!isLoaded || isComingSoon) && <EditorialSkeleton isComingSoon={isComingSoon} />}
    </div>
  );
};

export default EditorialSkeletonFrame;
