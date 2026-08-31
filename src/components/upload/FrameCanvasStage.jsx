import React, { useRef, useState, useEffect } from 'react';
import { CtaButton } from '../../ui';
import styles from './FrameUploadWorkspace.module.css';

const FrameCanvasStage = ({
  imageSrc,
  fileName,
  displaySrc,
  slots,
  selectedSlotId,
  isEyedropperActive,
  onCanvasTapKey,
  onSelectSlot,
  onUpdateSlot,
  onDeleteSlot,
  onDuplicateSlot,
  onConfirm
}) => {
  const containerRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(2 / 3);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  const activeImage = displaySrc || imageSrc;

  const handleEyedropTap = (e) => {
    e.stopPropagation();
    if (!containerRef.current || !onCanvasTapKey) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
    const xPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    onCanvasTapKey(xPercent, yPercent);
  };

  // Measure natural dimensions
  const handleImageLoad = (e) => {
    if (e.target.naturalWidth && e.target.naturalHeight) {
      setAspectRatio(e.target.naturalWidth / e.target.naturalHeight);
      setDimensions({
        w: e.target.naturalWidth,
        h: e.target.naturalHeight
      });
    }
  };

  // Drag & Resize State
  const activeAction = useRef(null); // { type: 'move' | 'resize', handle?: 'tl'|'tr'|'bl'|'br', slotId, startX, startY, initSlot }

  const handlePointerDown = (e, slot, actionType, handleName = null) => {
    e.stopPropagation();
    onSelectSlot(slot.id);

    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    activeAction.current = {
      type: actionType,
      handle: handleName,
      slotId: slot.id,
      startX: clientX,
      startY: clientY,
      initSlot: { ...slot }
    };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!activeAction.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

      const deltaXPercent = ((clientX - activeAction.current.startX) / rect.width) * 100;
      const deltaYPercent = ((clientY - activeAction.current.startY) / rect.height) * 100;

      const { type, handle, slotId, initSlot } = activeAction.current;

      if (type === 'move') {
        const newX = Math.max(0, Math.min(100 - initSlot.w, initSlot.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - initSlot.h, initSlot.y + deltaYPercent));

        onUpdateSlot(slotId, {
          x: Number(newX.toFixed(1)),
          y: Number(newY.toFixed(1))
        });
      } else if (type === 'resize') {
        let newX = initSlot.x;
        let newY = initSlot.y;
        let newW = initSlot.w;
        let newH = initSlot.h;

        if (handle === 'br') {
          newW = Math.max(5, Math.min(100 - initSlot.x, initSlot.w + deltaXPercent));
          newH = Math.max(5, Math.min(100 - initSlot.y, initSlot.h + deltaYPercent));
        } else if (handle === 'tl') {
          const maxLeftShift = initSlot.w - 5;
          const maxTopShift = initSlot.h - 5;
          const actualDx = Math.max(-initSlot.x, Math.min(maxLeftShift, deltaXPercent));
          const actualDy = Math.max(-initSlot.y, Math.min(maxTopShift, deltaYPercent));

          newX = initSlot.x + actualDx;
          newY = initSlot.y + actualDy;
          newW = initSlot.w - actualDx;
          newH = initSlot.h - actualDy;
        } else if (handle === 'tr') {
          const maxTopShift = initSlot.h - 5;
          const actualDy = Math.max(-initSlot.y, Math.min(maxTopShift, deltaYPercent));

          newY = initSlot.y + actualDy;
          newW = Math.max(5, Math.min(100 - initSlot.x, initSlot.w + deltaXPercent));
          newH = initSlot.h - actualDy;
        } else if (handle === 'bl') {
          const maxLeftShift = initSlot.w - 5;
          const actualDx = Math.max(-initSlot.x, Math.min(maxLeftShift, deltaXPercent));

          newX = initSlot.x + actualDx;
          newW = initSlot.w - actualDx;
          newH = Math.max(5, Math.min(100 - initSlot.y, initSlot.h + deltaYPercent));
        }

        onUpdateSlot(slotId, {
          x: Number(newX.toFixed(1)),
          y: Number(newY.toFixed(1)),
          w: Number(newW.toFixed(1)),
          h: Number(newH.toFixed(1))
        });
      }
    };

    const handlePointerUp = () => {
      activeAction.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [onUpdateSlot]);

  return (
    <div className={styles.canvasStageWrap} onClick={() => onSelectSlot(null)}>
      {/* Existing Blinking CTA Outside the frame */}
      {isEyedropperActive && (
        <span className="ctaLabel" style={{ marginBottom: '1.2rem' }}>
          TAP BACKGROUND COLOR ON FRAME
        </span>
      )}

      <div
        ref={containerRef}
        className={styles.canvasOuterFrame}
        onClick={(e) => e.stopPropagation()}
        style={{
          aspectRatio: `${aspectRatio}`,
          height: '64vh'
        }}
      >
        <div className="vf-corner tl"></div>
        <div className="vf-corner tr"></div>
        <div className="vf-corner bl"></div>
        <div className="vf-corner br"></div>
        <div className="boundary-dashed-line-visual"></div>

        {/* Checkerboard Backdrop */}
        <div className={styles.canvasBgGrid} />

        {/* Underlay Punchholes */}
        {slots.map((slot) => (
          <div
            key={`underlay-${slot.id}`}
            className={styles.slotUnderlay}
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.w}%`,
              height: `${slot.h}%`
            }}
          />
        ))}

        {/* Frame Overlay Image */}
        <img
          src={activeImage}
          alt="Custom Frame"
          className={styles.frameImg}
          onLoad={handleImageLoad}
        />

        {/* Transparent Eyedropper Tap Hitbox */}
        {isEyedropperActive && (
          <div
            className={styles.canvasEyedropHitbox}
            onClick={handleEyedropTap}
            onTouchStart={handleEyedropTap}
          />
        )}

        {/* Interactive Editable Slot Boxes */}
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          return (
            <div
              key={`interactive-${slot.id}`}
              className={`${styles.slotInteractiveBox} ${isSelected ? styles.selected : ''}`}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `${slot.w}%`,
                height: `${slot.h}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectSlot(slot.id);
              }}
              onMouseDown={(e) => handlePointerDown(e, slot, 'move')}
              onTouchStart={(e) => handlePointerDown(e, slot, 'move')}
            >
              {/* Big Centered Slot Number */}
              <div className={styles.slotCenterNumber}>
                {(slot.photo_index !== undefined ? slot.photo_index : slot.id) + 1}
              </div>

              {isSelected && (
                <>
                  {/* Duplicate Button (Top Left Corner) */}
                  <button
                    type="button"
                    className={styles.duplicateSlotBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlot?.(slot.id);
                    }}
                    title="Duplicate Slot"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>

                  {/* Delete Button (Top Right Corner) */}
                  <button
                    type="button"
                    className={styles.deleteSlotBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlot(slot.id);
                    }}
                    title="Delete Slot"
                  >
                    ✕
                  </button>

                  <div
                    className={`${styles.resizeHandle} ${styles.handleTL}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => handlePointerDown(e, slot, 'resize', 'tl')}
                    onTouchStart={(e) => handlePointerDown(e, slot, 'resize', 'tl')}
                  />
                  <div
                    className={`${styles.resizeHandle} ${styles.handleTR}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => handlePointerDown(e, slot, 'resize', 'tr')}
                    onTouchStart={(e) => handlePointerDown(e, slot, 'resize', 'tr')}
                  />
                  <div
                    className={`${styles.resizeHandle} ${styles.handleBL}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => handlePointerDown(e, slot, 'resize', 'bl')}
                    onTouchStart={(e) => handlePointerDown(e, slot, 'resize', 'bl')}
                  />
                  <div
                    className={`${styles.resizeHandle} ${styles.handleBR}`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => handlePointerDown(e, slot, 'resize', 'br')}
                    onTouchStart={(e) => handlePointerDown(e, slot, 'resize', 'br')}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.canvasFooterMeta}>
        {dimensions.w > 0 ? `${fileName || 'tutorial.png'} : ${dimensions.w} × ${dimensions.h} PX` : 'CALIBRATING CANVAS...'}
      </div>

      {onConfirm && (
        <div style={{ marginTop: '1.2rem', zIndex: 40 }}>
          <CtaButton
            onClick={onConfirm}
            disabled={slots.length === 0}
          >
            CONFIRM CANVAS
          </CtaButton>
        </div>
      )}
    </div>
  );
};

export default FrameCanvasStage;
