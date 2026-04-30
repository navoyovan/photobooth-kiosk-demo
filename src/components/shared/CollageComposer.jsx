import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, set } from 'animejs';

const CollageComposer = forwardRef(({ photos = [], frameSrc, photoFilter = 'none', isMirrored = false, isProcessing = false }, ref) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const statesRef = useRef(photos.map((_, i) => ({ x: i * 20, y: i * 20, w: 300, h: 300 })));
  const [ready, setReady] = useState(false);
  const [metrics, setMetrics] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const photoRefs = useRef([]);
  const boundaryRef = useRef(null); // renamed from handleWrapperRef
  const containerDims = useRef(null);
  const photoAspects = useRef({});

  useEffect(() => {
    if (photos.length !== statesRef.current.length) {
      statesRef.current = photos.map((_, i) => {
        return statesRef.current[i] || { x: i * 40, y: i * 40, w: 300, h: 300 };
      });
    }
  }, [photos]);

  useImperativeHandle(ref, () => ({
    getComposition: () => ({
      photos: photos.map((src, i) => ({
        src,
        ...statesRef.current[i]
      })),
      cW: containerDims.current?.cW || 400,
      cH: containerDims.current?.cH || 400,
      photoFilter,
      isMirrored,
      isCollage: true
    })
  }));

  const updateMetrics = () => {
    const s = statesRef.current[activeIndex];
    if (s) {
      setMetrics({
        x: Math.round(s.x),
        y: Math.round(s.y),
        w: Math.round(s.w),
        h: Math.round(s.h)
      });
    }
  };

  const initPhotoPlacement = (cW, cH, photoIdx) => {
    let s = statesRef.current[photoIdx];
    if (!s) {
      s = { x: photoIdx * 40, y: photoIdx * 40, w: 300, h: 300 };
      statesRef.current[photoIdx] = s;
    }

    const aspect = photoAspects.current[photoIdx] || (cW / cH);

    const initH = cH;
    const initW = initH * aspect;
    const initX = (cW - initW) / 2;
    const initY = 0;

    s.x = initX;
    s.y = initY;
    s.w = initW;
    s.h = initH;

    if (photoRefs.current[photoIdx]) {
      set(photoRefs.current[photoIdx], { translateX: initX, translateY: initY, width: initW, height: initH });
    }

    if (photoIdx === activeIndex) {
      set(boundaryRef.current, { translateX: initX, translateY: initY, width: initW, height: initH });
      updateMetrics();
    }
  };

  const handlePhotoLoad = (e, index) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    photoAspects.current[index] = naturalWidth / naturalHeight;
    if (containerDims.current) {
      initPhotoPlacement(containerDims.current.cW, containerDims.current.cH, index);
    }
  };

  const handleFrameLoad = () => {
    if (!frameRef.current || !containerRef.current) return;
    const img = frameRef.current;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    const maxH = window.innerHeight * 0.55;
    const maxW = 500;
    let cW, cH;
    if (natW / natH > maxW / maxH) {
      cW = maxW;
      cH = maxW * (natH / natW);
    } else {
      cH = maxH;
      cW = maxH * (natW / natH);
    }

    containerRef.current.style.width = cW + 'px';
    containerRef.current.style.height = cH + 'px';
    containerDims.current = { cW, cH };

    photos.forEach((_, i) => initPhotoPlacement(cW, cH, i));
    setReady(true);
  };

  const handlePointerDown = (e, isResize) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const s = statesRef.current[activeIndex];
    const initX = s.x;
    const initY = s.y;
    const initW = s.w;
    const initH = s.h;

    const onMove = (mv) => {
      const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
      if (isResize) {
        const dx = mv.clientX - startX;
        const newW = Math.max(50, initW + dx);
        const newH = initH * (newW / initW);
        s.w = newW;
        s.h = newH;
        set([photoRefs.current[activeIndex], boundaryRef.current], { width: newW, height: newH });
      } else {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        const newX = initX + dx;
        const newY = initY + dy;
        s.x = newX;
        s.y = newY;
        set([photoRefs.current[activeIndex], boundaryRef.current], { translateX: newX, translateY: newY });
      }
      updateMetrics();
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const switchLayer = (idx) => {
    setActiveIndex(idx);
    const s = statesRef.current[idx];
    set(boundaryRef.current, { translateX: s.x, translateY: s.y, width: s.w, height: s.h });
    updateMetrics();
  };

  useEffect(() => {
    if (!ready || photos.length === 0) return;

    photoRefs.current.forEach(photoEl => {
      if (photoEl) {
        const wrapper = photoEl.querySelector('.lens-refocus-wrapper');
        if (wrapper) {
          if (isProcessing) {
            animate(wrapper, {
              filter: 'blur(12px)',
              scale: 1.04,
              duration: 200,
              easing: 'easeOutQuad'
            });
          } else {
            animate(wrapper, {
              filter: 'blur(0px)',
              scale: 1,
              duration: 400,
              easing: 'easeOutBack(2)'
            });
          }
        }
      }
    });
  }, [isProcessing, ready, photos]);

  return (
    <div className="composer-gallery-wrapper">
      {photos.length > 1 && (
        <div className="layer-switcher-panel">
          <div className="layer-label">SLOT_INDEX</div>
          {photos.map((_, i) => (
            <button
              key={i}
              className={`btn-layer-item ${activeIndex === i ? 'active' : ''}`}
              onClick={() => switchLayer(i)}
            >
              0{i + 1}
            </button>
          ))}
        </div>
      )}

      {/*
        gallery-pedestal: overflow VISIBLE so the boundary+handle
        can hang outside without being clipped.
      */}
      <div
        ref={containerRef}
        className="gallery-pedestal"
        style={{ position: 'relative', width: '400px', height: '400px', overflow: 'visible' }}
      >
        <div className="hud-data-box top-left">POS_X: {metrics.x}PX</div>
        <div className="hud-data-box top-right">POS_Y: {metrics.y}PX</div>
        <div className="hud-data-box bottom-left">WIDTH: {metrics.w}PX</div>
        <div className="hud-data-box bottom-right">HEIGHT: {metrics.h}PX</div>

        {/*
          photo-clip-layer: clips photos + frame to the frame bounds.
          The boundary tracker lives outside this, so it always shows above.
        */}
        <div className="photo-clip-layer">
          {photos.map((src, i) => (
            <div
              key={i}
              ref={el => photoRefs.current[i] = el}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                touchAction: 'none',
                zIndex: activeIndex === i ? 5 : 1,
                transition: 'opacity 0.2s',
                opacity: isProcessing ? 0.5 : 1,
                pointerEvents: activeIndex === i ? 'auto' : 'none',
              }}
              onPointerDown={(e) => i === activeIndex && handlePointerDown(e, false)}
            >
              <div className="lens-refocus-wrapper" style={{ width: '100%', height: '100%' }}>
                <img
                  src={src || '/taken_pic/default.png'}
                  onLoad={(e) => handlePhotoLoad(e, i)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                    display: 'block',
                    pointerEvents: 'none',
                    filter: photoFilter,
                    transform: isMirrored ? 'scaleX(-1)' : 'none'
                  }}
                  alt={`Slot ${i}`}
                  draggable={false}
                />
              </div>
            </div>
          ))}

          {/* FRAME OVERLAY */}
          <img
            ref={frameRef}
            src={frameSrc}
            onLoad={handleFrameLoad}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'fill',
              pointerEvents: 'none',
              zIndex: 10
            }}
            alt="Frame overlay"
          />

          {/* CROP MARKS */}
          <div className="crop-marks-container" style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none' }}>
            <div className="crop-mark top-left"></div>
            <div className="crop-mark top-right"></div>
            <div className="crop-mark bottom-left"></div>
            <div className="crop-mark bottom-right"></div>
          </div>
        </div>

        {/*
          PHOTO BOUNDARY + RESIZE BTN
          Sibling of photo-clip-layer, outside overflow:hidden.
          GSAP tracks this to the active photo's position/size.
        */}
        <div
          ref={boundaryRef}
          className={`photo-boundary-tracker${isProcessing ? ' hidden' : ''}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Dashed border — inner div, never clipped by overflow:hidden */}
          <div
            className="boundary-dashed-line"
            onPointerDown={(e) => handlePointerDown(e, false)}
          />

          <div
            className="photo-resize-btn"
            onPointerDown={(e) => handlePointerDown(e, true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
              <path d="M15 3h6v6" />
              <path d="M9 21H3v-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CollageComposer;

