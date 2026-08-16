import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, set } from 'animejs';
import { getFrameLayout } from '../../constants/frame_layouts';
import { assetUrl } from '../../utils/assetUrl';

const CollageComposer = forwardRef(({ photos = [], frame, photoFilter = 'none', isMirrored = false, isProcessing = false, onActiveIndexChange }, ref) => {
  const containerRef = useRef(null);
  const frameRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const statesRef = useRef(photos.map((_, i) => ({ x: 0, y: 0, w: 300, h: 300 })));
  const [ready, setReady] = useState(false);
  const [pedestalSize, setPedestalSize] = useState({ w: 0, h: 0 });
  const [metrics, setMetrics] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const photoRefs = useRef([]);
  const boundaryRef = useRef(null);
  const containerDims = useRef(null);
  const photoAspects = useRef({});
  const dragHandlers = useRef({ onMove: null, onUp: null });

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
        photos: layout.map((slot, i) => {
          const photoIdx = slot.photo_index !== undefined ? slot.photo_index : i;
          const src = photos[photoIdx];
          const s = statesRef.current[photoIdx] || { x: 0, y: 0, w: 300, h: 300 };
          const sX = (slot.x / 100) * cW;
          const sY = (slot.y / 100) * cH;
          const sW = (slot.w / 100) * cW;
          const sH = (slot.h / 100) * cH;
          const absX = sX + s.x;
          const absY = sY + s.y;

          return { src, x: absX, y: absY, w: s.w, h: s.h, sX, sY, sW, sH };
        }),
        cW, cH, photoFilter, isMirrored, isCollage: true
      };
    }
  }));

  const updateMetrics = (forceIdx) => {
    const idx = forceIdx !== undefined ? forceIdx : activeIndex;
    const s = statesRef.current[idx];
    const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
    const layout = getFrameLayout(frame);
    const firstSlotIdx = layout.findIndex((s, i) => (s.photo_index !== undefined ? s.photo_index : i) === idx);
    const slot = layout[firstSlotIdx] || layout[idx] || { x: 0, y: 0, w: 100, h: 100 };
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
    const firstSlotIdx = layout.findIndex((s, idx) => (s.photo_index !== undefined ? s.photo_index : idx) === photoIdx);
    if (firstSlotIdx === -1) return;
    const slot = layout[firstSlotIdx];

    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;
    const slotW = (slot.w / 100) * cW;
    const slotH = (slot.h / 100) * cH;

    const aspect = photoAspects.current[photoIdx] || (slotW / slotH);
    const slotAspect = slotW / slotH;

    let initW, initH, initX, initY;

    if (aspect > slotAspect) {
      initH = slotH;
      initW = slotH * aspect;
      initX = (slotW - initW) / 2;
      initY = 0;
    } else {
      initW = slotW;
      initH = slotW / aspect;
      initX = 0;
      initY = (slotH - initH) / 2;
    }

    const s = { x: initX, y: initY, w: initW, h: initH };
    statesRef.current[photoIdx] = s;

    layout.forEach((sl, idx) => {
      if ((sl.photo_index !== undefined ? sl.photo_index : idx) === photoIdx) {
        if (photoRefs.current[idx]) {
          set(photoRefs.current[idx], { translateX: initX, translateY: initY, width: initW, height: initH });
        }
      }
    });

    if (photoIdx === activeIndex && boundaryRef.current) {
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
    const { naturalWidth: natW, naturalHeight: natH } = frameRef.current;

    const maxH = window.innerHeight * 0.55;
    const maxW = 500;

    const cW = natW / natH > maxW / maxH ? maxW : maxH * (natW / natH);
    const cH = natW / natH > maxW / maxH ? maxW * (natH / natW) : maxH;

    setPedestalSize({ w: cW, h: cH });
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
      const targetSlotIndexes = layout.map((sl, idx) => ((sl.photo_index !== undefined ? sl.photo_index : idx) === activeIndex ? idx : null)).filter(idx => idx !== null);
      if (targetSlotIndexes.length === 0) return;

      const firstSlotIdx = targetSlotIndexes[0];
      const slot = layout[firstSlotIdx];
      const slotX = (slot.x / 100) * cW;
      const slotY = (slot.y / 100) * cH;

      if (isResize) {
        const dx = mv.clientX - startX;
        const newW = Math.max(50, initW + dx);
        const newH = initH * (newW / initW);
        s.w = newW;
        s.h = newH;
        targetSlotIndexes.forEach(slotIdx => {
          if (photoRefs.current[slotIdx]) {
            set(photoRefs.current[slotIdx], { width: newW, height: newH });
          }
        });
        set(boundaryRef.current, { width: newW, height: newH });
      } else {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        const newX = initX + dx;
        const newY = initY + dy;
        s.x = newX;
        s.y = newY;
        targetSlotIndexes.forEach(slotIdx => {
          if (photoRefs.current[slotIdx]) {
            set(photoRefs.current[slotIdx], { translateX: newX, translateY: newY });
          }
        });
        set(boundaryRef.current, { translateX: slotX + newX, translateY: slotY + newY });
      }
      updateMetrics();
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      dragHandlers.current = { onMove: null, onUp: null };
    };

    dragHandlers.current = { onMove, onUp };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  useEffect(() => {
    return () => {
      if (dragHandlers.current.onMove) {
        window.removeEventListener('pointermove', dragHandlers.current.onMove);
      }
      if (dragHandlers.current.onUp) {
        window.removeEventListener('pointerup', dragHandlers.current.onUp);
      }
    };
  }, []);

  const switchLayer = (idx) => {
    setActiveIndex(idx);
    if (onActiveIndexChange) onActiveIndexChange(idx);
    const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
    const layout = getFrameLayout(frame);
    const firstSlotIdx = layout.findIndex((s, i) => (s.photo_index !== undefined ? s.photo_index : i) === idx);
    const slot = layout[firstSlotIdx] || layout[idx] || { x: 0, y: 0, w: 100, h: 100 };
    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;

    const s = statesRef.current[idx];
    if (s) {
      set(boundaryRef.current, {
        translateX: slotX + s.x,
        translateY: slotY + s.y,
        width: s.w,
        height: s.h
      });
    }
    updateMetrics(idx);
  };

  const layout = getFrameLayout(frame);
  const totalSlots = frame?.slots || (Array.isArray(layout) ? layout.length : 1);

  useEffect(() => {
    if (activeIndex >= totalSlots) {
      const clamped = Math.max(0, totalSlots - 1);
      setActiveIndex(clamped);
      if (onActiveIndexChange) onActiveIndexChange(clamped);
    }
  }, [totalSlots, activeIndex, onActiveIndexChange]);

  return (
    <div className="composer-gallery-wrapper">
      {photos.length > 1 && (
        <div className="layer-switcher-vertical">
          <div className="layer-label-micro">SLOT_INDEX</div>
          {photos.map((_, i) => {
            const isDisabled = i >= totalSlots;
            return (
              <button
                key={i}
                disabled={isDisabled}
                className={`btn-layer-square ${activeIndex === i ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && switchLayer(i)}
              >
                0{i + 1}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={containerRef}
        className="gallery-pedestal"
        style={{
          position: 'relative',
          width: pedestalSize.w ? `${pedestalSize.w}px` : '400px',
          height: pedestalSize.h ? `${pedestalSize.h}px` : '400px',
          overflow: 'visible'
        }}
      >
        <div className="viewfinder-hud-layer" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1000 }}>
          <div style={{ position: 'absolute', transform: `translate(${metrics.x}px, ${metrics.y}px)`, width: `${metrics.w}px`, height: `${metrics.h}px` }}>
            <div className="viewfinder-crosshair"></div>
            <div className="vf-corner tl"></div>
            <div className="vf-corner tr"></div>
            <div className="vf-corner bl"></div>
            <div className="vf-corner br"></div>
            <div className="boundary-dashed-line-visual"></div>
          </div>
        </div>

        <div className="hud-data-box top-left">LNS_X: {metrics.x}PX</div>
        <div className="hud-data-box top-right">LNS_Y: {metrics.y}PX</div>
        <div className="hud-data-box bottom-left">W_SCALE: {metrics.w}PX</div>
        <div className="hud-data-box bottom-right">H_SCALE: {metrics.h}PX</div>

        <div className="photo-clip-layer">
          {layout.map((slot, i) => {
            const photoIdx = slot.photo_index !== undefined ? slot.photo_index : i;
            const src = photos[photoIdx];

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
                  zIndex: activeIndex === photoIdx ? 5 : 1,
                  opacity: 1,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                }}
                onClick={() => switchLayer(photoIdx)}
              >
                <div
                  ref={el => photoRefs.current[i] = el}
                  style={{ position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
                  onPointerDown={(e) => photoIdx === activeIndex && handlePointerDown(e, false)}
                >
                  <div className="lens-refocus-wrapper" style={{ width: '100%', height: '100%' }}>
                    <img
                      src={src || assetUrl('taken_pic/default.png')}
                      onLoad={(e) => handlePhotoLoad(e, photoIdx)}
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
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 10 }}
            alt="Frame overlay"
          />

          <div className="crop-marks-container" style={{ position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none' }}>
            <div className="crop-mark top-left"></div>
            <div className="crop-mark top-right"></div>
            <div className="crop-mark bottom-left"></div>
            <div className="crop-mark bottom-right"></div>
          </div>
        </div>

        <div ref={boundaryRef} className={`photo-boundary-tracker${isProcessing ? ' hidden' : ''}`} style={{ position: 'absolute', top: 0, left: 0 }}>
          <div className="boundary-dashed-line" onPointerDown={(e) => handlePointerDown(e, false)} />
          <div className="photo-resize-btn" onPointerDown={(e) => handlePointerDown(e, true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
              <path d="M15 3h6v6" /><path d="M9 21H3v-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CollageComposer;
