import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, set } from 'animejs';
import { getFrameLayout } from '../../constants/frame_layouts';

const CollageComposer = forwardRef(({ photos = [], frame, photoFilter = 'none', isMirrored = false, isProcessing = false }, ref) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const statesRef = useRef(photos.map((_, i) => ({ x: 0, y: 0, w: 300, h: 300 })));
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
    getComposition: () => {
      const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
      const layout = getFrameLayout(frame);

      return {
        photos: photos.map((src, i) => {
          const s = statesRef.current[i];
          const slot = layout[i] || { x: 0, y: 0, w: 100, h: 100 };

          // Slot dimensions in pixels
          const sX = (slot.x / 100) * cW;
          const sY = (slot.y / 100) * cH;
          const sW = (slot.w / 100) * cW;
          const sH = (slot.h / 100) * cH;

          // Absolute pixels relative to the frame/container
          const absX = sX + s.x;
          const absY = sY + s.y;

          return {
            src,
            x: absX,
            y: absY,
            w: s.w,
            h: s.h,
            // Provide clipping slot data to the backend
            sX, sY, sW, sH
          };
        }),
        cW: cW,
        cH: cH,
        photoFilter,
        isMirrored,
        isCollage: true
      };
    }
  }));

  const updateMetrics = (forceIdx) => {
    const idx = forceIdx !== undefined ? forceIdx : activeIndex;
    const s = statesRef.current[idx];
    const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
    const layout = getFrameLayout(frame);
    const slot = layout[idx] || { x: 0, y: 0, w: 100, h: 100 };
    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;

    if (s) {
      setMetrics({
        x: Math.round(slotX + s.x),
        y: Math.round(slotY + s.y),
        w: Math.round(s.w),
        h: Math.round(s.h)
      });
    }
  };

  const initPhotoPlacement = (cW, cH, photoIdx) => {
    const layout = getFrameLayout(frame);
    const slot = layout[photoIdx] || { x: 0, y: 0, w: 100, h: 100 };

    // Convert percentage to pixels for the slot window
    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;
    const slotW = (slot.w / 100) * cW;
    const slotH = (slot.h / 100) * cH;

    const aspect = photoAspects.current[photoIdx] || (slotW / slotH);
    const slotAspect = slotW / slotH;

    let initW, initH, initX, initY;

    // "Object-Fit: Cover" logic relative to the slot
    if (aspect > slotAspect) {
      // Photo is wider than slot
      initH = slotH;
      initW = slotH * aspect;
      initX = (slotW - initW) / 2;
      initY = 0;
    } else {
      // Photo is taller than slot
      initW = slotW;
      initH = slotW / aspect;
      initX = 0;
      initY = (slotH - initH) / 2;
    }

    const s = { x: initX, y: initY, w: initW, h: initH };
    statesRef.current[photoIdx] = s;

    if (photoRefs.current[photoIdx]) {
      set(photoRefs.current[photoIdx], { translateX: initX, translateY: initY, width: initW, height: initH });
    }

    if (photoIdx === activeIndex) {
      // Boundary tracker follows the photo relative to the pedestal
      // We need to add slot offset for the global tracker position
      const globalX = slotX + initX;
      const globalY = slotY + initY;
      set(boundaryRef.current, { translateX: globalX, translateY: globalY, width: initW, height: initH });
      updateMetrics(photoIdx);
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
      const layout = getFrameLayout(frame);
      const slot = layout[activeIndex] || { x: 0, y: 0, w: 100, h: 100 };
      const slotX = (slot.x / 100) * cW;
      const slotY = (slot.y / 100) * cH;

      if (isResize) {
        const dx = mv.clientX - startX;
        const newW = Math.max(50, initW + dx);
        const newH = initH * (newW / initW);
        s.w = newW;
        s.h = newH;
        set(photoRefs.current[activeIndex], { width: newW, height: newH });
        set(boundaryRef.current, { width: newW, height: newH });
      } else {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        const newX = initX + dx;
        const newY = initY + dy;
        s.x = newX;
        s.y = newY;
        set(photoRefs.current[activeIndex], { translateX: newX, translateY: newY });
        set(boundaryRef.current, { translateX: slotX + newX, translateY: slotY + newY });
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
    const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
    const layout = getFrameLayout(frame);
    const slot = layout[idx] || { x: 0, y: 0, w: 100, h: 100 };
    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;

    const s = statesRef.current[idx];
    set(boundaryRef.current, {
      translateX: slotX + s.x,
      translateY: slotY + s.y,
      width: s.w,
      height: s.h
    });
    updateMetrics(idx);
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
      {/* INTERNAL HUD LAYER: Viewfinder lines that sit on top but stay relative to the pedestal */}
      <div
        className="viewfinder-hud-layer"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        <div
          style={{
            position: 'absolute',
            transform: `translate(${metrics.x}px, ${metrics.y}px)`,
            width: `${metrics.w}px`,
            height: `${metrics.h}px`,
          }}
        >
          <div className="viewfinder-crosshair"></div>
          <div className="vf-corner tl"></div>
          <div className="vf-corner tr"></div>
          <div className="vf-corner bl"></div>
          <div className="vf-corner br"></div>
          <div className="boundary-dashed-line-visual"></div>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="layer-switcher-vertical">
          <div className="layer-label-micro">SLOT_INDEX</div>
          {photos.map((_, i) => (
            <button
              key={i}
              className={`btn-layer-square ${activeIndex === i ? 'active' : ''}`}
              onClick={() => switchLayer(i)}
            >
              0{i + 1}
            </button>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        className="gallery-pedestal"
        style={{ position: 'relative', width: '400px', height: '400px', overflow: 'visible' }}
      >
        <div className="hud-data-box top-left">LNS_X: {metrics.x}PX</div>
        <div className="hud-data-box top-right">LNS_Y: {metrics.y}PX</div>
        <div className="hud-data-box bottom-left">W_SCALE: {metrics.w}PX</div>
        <div className="hud-data-box bottom-right">H_SCALE: {metrics.h}PX</div>

        <div className="photo-clip-layer">
          {photos.map((src, i) => {
            const layout = getFrameLayout(frame);
            const slot = layout[i] || { x: 0, y: 0, w: 100, h: 100 };

            return (
              <div
                key={i}
                className={`slot-window slot-${i}`}
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  overflow: 'hidden',
                  zIndex: activeIndex === i ? 5 : 1,
                  transition: 'opacity 0.3s ease',
                  opacity: isProcessing ? 0.3 : (activeIndex === i ? 1 : 0.4),
                  pointerEvents: activeIndex === i ? 'auto' : 'none',
                }}
              >
                <div
                  ref={el => photoRefs.current[i] = el}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    touchAction: 'none',
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
              </div>
            );
          })}

          <img
            ref={frameRef}
            src={frame.thumbnail}
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

          <div className="crop-marks-container" style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none' }}>
            <div className="crop-mark top-left"></div>
            <div className="crop-mark top-right"></div>
            <div className="crop-mark bottom-left"></div>
            <div className="crop-mark bottom-right"></div>
          </div>
        </div>

        <div
          ref={boundaryRef}
          className={`photo-boundary-tracker${isProcessing ? ' hidden' : ''}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
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

