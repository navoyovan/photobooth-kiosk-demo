import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, set } from 'animejs';
import { getFrameLayout } from '../../constants/frame_layouts';

const InteractivePhoto = forwardRef(({ photos = [], frame, photoFilter = 'none', isMirrored = false, isProcessing = false, onActiveIndexChange }, ref) => {
  const photoRef = useRef(null);
  const boundaryRef = useRef(null); // tracks photo bounds
  const frameRef = useRef(null);
  const containerRef = useRef(null);
  const state = useRef({ x: 0, y: 0, w: 300, h: 300 });
  const [ready, setReady] = useState(false);
  const [pedestalSize, setPedestalSize] = useState({ w: 0, h: 0 });
  const [metrics, setMetrics] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const photoNaturalDims = useRef(null);
  const containerDims = useRef(null);
  const dragHandlers = useRef({ onMove: null, onUp: null });

  const src = photos[0];

  useImperativeHandle(ref, () => ({
    getComposition: () => {
      const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
      const layout = getFrameLayout(frame);
      const slot = layout[0] || { x: 0, y: 0, w: 100, h: 100 };

      // Slot dimensions in pixels
      const sX = (slot.x / 100) * cW;
      const sY = (slot.y / 100) * cH;
      const sW = (slot.w / 100) * cW;
      const sH = (slot.h / 100) * cH;

      // Absolute pixels relative to the frame/container
      const absX = sX + state.current.x;
      const absY = sY + state.current.y;

      return {
        photos: [{
          src,
          x: absX,
          y: absY,
          w: state.current.w,
          h: state.current.h,
          sX, sY, sW, sH
        }],
        cW: cW,
        cH: cH,
        photoFilter,
        isMirrored,
        isCollage: false
      };
    }
  }));

  const updateMetrics = () => {
    const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
    const layout = getFrameLayout(frame);
    const slot = layout[0] || { x: 0, y: 0, w: 100, h: 100 };
    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;

    // The HUD should track the PHOTO boundaries (state.current)
    // but must be offset by the SLOT position to align correctly on screen
    setMetrics({
      x: Math.round(slotX + state.current.x),
      y: Math.round(slotY + state.current.y),
      w: Math.round(state.current.w),
      h: Math.round(state.current.h)
    });
  };

  const initPhotoPlacement = (cW, cH) => {
    const layout = getFrameLayout(frame);
    const slot = layout[0] || { x: 0, y: 0, w: 100, h: 100 };

    const slotX = (slot.x / 100) * cW;
    const slotY = (slot.y / 100) * cH;
    const slotW = (slot.w / 100) * cW;
    const slotH = (slot.h / 100) * cH;

    const natPhotoW = photoNaturalDims.current?.w || slotW;
    const natPhotoH = photoNaturalDims.current?.h || slotH;
    const aspect = natPhotoW / natPhotoH;
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

    state.current = { x: initX, y: initY, w: initW, h: initH };

    if (photoRef.current) {
      set(photoRef.current, { translateX: initX, translateY: initY, width: initW, height: initH });
    }

    if (boundaryRef.current) {
      const globalX = slotX + initX;
      const globalY = slotY + initY;
      set(boundaryRef.current, { translateX: globalX, translateY: globalY, width: initW, height: initH });
    }

    updateMetrics();
    setReady(true);
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

    if (photoNaturalDims.current) {
      initPhotoPlacement(cW, cH);
    }
  };

  const handlePhotoLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    photoNaturalDims.current = { w, h };
    if (containerDims.current) {
      initPhotoPlacement(containerDims.current.cW, containerDims.current.cH);
    }
  };

  useEffect(() => {
    if (ready && containerDims.current && photoNaturalDims.current) {
      initPhotoPlacement(containerDims.current.cW, containerDims.current.cH);
    }
  }, [frame.id, frame.slots_config]);

  const handlePointerDown = (e, isResize) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = state.current.x;
    const initY = state.current.y;
    const initW = state.current.w;
    const initH = state.current.h;

    const onMove = (mv) => {
      const { cW, cH } = containerDims.current || { cW: 400, cH: 400 };
      if (isResize) {
        const dx = mv.clientX - startX;
        const newW = Math.max(100, initW + dx);
        const newH = initH * (newW / initW);
        state.current.w = newW;
        state.current.h = newH;
        set([photoRef.current, boundaryRef.current], { width: newW, height: newH });
      } else {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;
        const newX = initX + dx;
        const newY = initY + dy;
        state.current.x = newX;
        state.current.y = newY;

        const layout = getFrameLayout(frame);
        const slot = layout[0] || { x: 0, y: 0, w: 100, h: 100 };
        const slotX = (slot.x / 100) * cW;
        const slotY = (slot.y / 100) * cH;

        set(photoRef.current, { translateX: newX, translateY: newY });
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


  return (
    <div className="composer-gallery-wrapper">
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

        <div className="hud-data-box top-left">POS_X: {metrics.x}PX</div>
        <div className="hud-data-box top-right">POS_Y: {metrics.y}PX</div>
        <div className="hud-data-box bottom-left">WIDTH: {metrics.w}PX</div>
        <div className="hud-data-box bottom-right">HEIGHT: {metrics.h}PX</div>

        <div className="photo-clip-layer">
          {(() => {
            const layout = getFrameLayout(frame);
            const slot = layout[0] || { x: 0, y: 0, w: 100, h: 100 };
            return (
              <div
                className="slot-window slot-0"
                style={{
                  position: 'absolute',
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.w}%`,
                  height: `${slot.h}%`,
                  overflow: 'hidden',
                  zIndex: 1,
                  transition: 'opacity 0.1s ease-in-out',
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                <div
                  ref={photoRef}
                  style={{ position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
                  onPointerDown={(e) => handlePointerDown(e, false)}
                >
                  <div className="lens-refocus-wrapper" style={{ width: '100%', height: '100%' }}>
                    <img
                      src={src || '/taken_pic/default.png'}
                      onLoad={handlePhotoLoad}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        display: 'block',
                        pointerEvents: 'none',
                        filter: photoFilter,
                        transform: isMirrored ? 'scaleX(-1)' : 'none'
                      }}
                      alt="Captured"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          <img
            ref={frameRef}
            src={frame.thumbnail}
            onLoad={handleFrameLoad}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none', zIndex: 3 }}
            alt="Frame overlay"
          />

          <div className="crop-marks-container" style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
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

export default InteractivePhoto;
