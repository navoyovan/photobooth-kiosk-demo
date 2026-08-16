import React, { useState, useRef, useEffect } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import EditorialSkeletonFrame from '../shared/EditorialSkeletonFrame';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import { TRANSLATIONS } from '../../constants/translations';
import { FRAME_TYPES } from '../../constants/frames';
import FrameUploadWorkspace from '../upload/FrameUploadWorkspace';
import FrameSlotToolbar from '../upload/FrameSlotToolbar';
import { useFrameUpload } from '../../hooks/useFrameUpload';
import { CtaButton } from '../../ui';
import styles from './02-Selection.module.css';

const CATEGORIES = ['SPACE', 'GRID'];

const SelectionScreenInner = ({ onFinish, onPrepareCamera, kioskData, loading, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef(null);
  const rightPanelRef = useRef(null);
  const colRefs = useRef([]);
  const watermarkRef = useRef(null);
  const leftPanelRef = useRef(null);
  const indicatorRef = useRef(null);
  const frameRefText = useRef(null);
  const uploadRefText = useRef(null);

  const [activeCategory, setActiveCategory] = useState("FRAMES"); // FRAMES or UPLOAD
  const [activeFrame, setActiveFrame] = useState(null); // Nothing selected on mount

  const uploadState = useFrameUpload();

  const scrollState = useRef({ current: 0, target: 0 });
  const activeFrameRef = useRef(null);
  const autoSpeedRef = useRef(1.2); // px/frame constant drift

  // Tab indicator & right panel transition
  useEffect(() => {
    const isUpload = activeCategory === 'UPLOAD';
    if (indicatorRef.current) {
      animate(indicatorRef.current, {
        top: isUpload ? '6.1rem' : '0',
        duration: 600,
        easing: 'easeOutElastic(1, .75)'
      });
    }

    if (frameRefText.current) {
      animate(frameRefText.current, {
        translateX: !isUpload ? 0 : '3rem',
        opacity: !isUpload ? 1 : 0.3,
        duration: 500,
        easing: 'easeOutCubic'
      });
    }

    if (uploadRefText.current) {
      animate(uploadRefText.current, {
        translateX: isUpload ? 0 : '3rem',
        opacity: isUpload ? 1 : 0.3,
        duration: 500,
        easing: 'easeOutCubic'
      });
    }

    if (rightPanelRef.current) {
      animate(rightPanelRef.current, {
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuart'
      });
    }
  }, [activeCategory]);

  // Entrance Sequence
  const timelineRef = useRef(null);
  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    entranceEditorialLayout(tl, { duration: 800 });

    tl.add(`.${styles.scrollCol}`, {
      translateX: [50, 0],
      duration: 600,
      delay: stagger(50),
      easing: 'easeOutQuad'
    }, 250);

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  // Modal Animation References & Logic
  const modalOverlayRef = useRef(null);
  const modalContentRef = useRef(null);
  useEffect(() => {
    if (activeFrame !== null && modalOverlayRef.current) {
      animate(modalOverlayRef.current, {
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad'
      });
      animate(modalContentRef.current, {
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 400,
        delay: 100,
        easing: 'easeOutBack(1.2)'
      });
    }
  }, [activeFrame]);

  const handleFinish = (frameId) => {
    const selectedFrameData = filteredFrames.find(f => f.id === frameId);
    const tl = createTimeline({
      onComplete: () => onFinish(selectedFrameData)
    });

    if (modalContentRef.current) {
      tl.add(modalContentRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 300,
        easing: 'easeInBack(1.2)'
      }, 0);
    }

    if (modalOverlayRef.current) {
      tl.add(modalOverlayRef.current, {
        opacity: 0,
        duration: 400,
        easing: 'linear'
      }, 100);
    }

    exitEditorialLayout(tl, { duration: 500 });
  };

  // Filter & Generate Frames
  const filteredFrames = React.useMemo(() => {
    if (loading) {
      return Array.from({ length: 8 }).map((_, i) => ({
        id: `skeleton-${i}`,
        isLoading: true,
        thumbnail: null,
        name: "Loading...",
        slots: 1
      }));
    }

    if (activeCategory === 'UPLOAD') {
      return [];
    }

    // Include all frames (both single-slot SPACE and multi-slot GRID/Collage) preserving slots_config metadata
    const sourceFrames = (kioskData?.frames && kioskData.frames.length > 0)
      ? kioskData.frames.map(f => ({
          id: f.id,
          category: f.category || 'FRAMES',
          thumbnail: f.asset_path,
          name: f.name,
          slots: f.slots || 1,
          slots_config: f.slots_config
        }))
      : FRAME_TYPES;

    // Guarantee minimum items for infinite scroll stability
    const placeholderCount = Math.max(2, 8 - sourceFrames.length);
    const placeholders = Array.from({ length: placeholderCount }).map((_, i) => ({
      id: `placeholder-${i}`,
      isPlaceholder: true,
      thumbnail: null,
      name: t('comingSoon'),
      slots: 1
    }));

    return [...sourceFrames, ...placeholders];
  }, [activeCategory, kioskData, loading, language]);

  // Construct 4 staggered infinite columns (6 repetitions each)
  const infiniteCols = React.useMemo(() => {
    if (activeCategory === 'UPLOAD' || filteredFrames.length === 0) return [];
    return Array.from({ length: 4 }).map((_, colIndex) => {
      const base = [...filteredFrames.slice(colIndex), ...filteredFrames.slice(0, colIndex)];
      let massiveArray = [];
      for (let i = 0; i < 6; i++) {
        massiveArray = massiveArray.concat(base);
      }
      return massiveArray;
    });
  }, [filteredFrames, activeCategory]);

  // Reset scroll when category changes
  useEffect(() => {
    scrollState.current.target = 0;
    scrollState.current.current = 0;
    activeFrameRef.current = null;
    setActiveFrame(null);
  }, [activeCategory]);

  // High-Performance Physics, Momentum & Inertia Touch/Wheel Engine
  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;

    let animationFrame;
    let isDragging = false;
    let startY = 0;
    let userVelocity = 0;
    let autoScrollPaused = false;
    let autoScrollTimeout = null;

    const handleWheel = (e) => {
      e.preventDefault();
      userVelocity += e.deltaY * 0.4;

      autoScrollPaused = true;
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
      autoScrollTimeout = setTimeout(() => {
        autoScrollPaused = false;
      }, 1500);
    };

    const handleStart = (e) => {
      isDragging = true;
      autoScrollPaused = true;
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
      userVelocity = 0;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;

      // Divide by 0.6 scale factor for 1:1 finger tracking
      const delta = (startY - currentY) / 0.6;
      userVelocity = delta;

      scrollState.current.target += delta;
      scrollState.current.current = scrollState.current.target; // immediate stickiness
      startY = currentY;
    };

    const handleEnd = () => {
      isDragging = false;
      if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
      autoScrollTimeout = setTimeout(() => {
        autoScrollPaused = false;
      }, 1500);
    };

    const smoothScroll = () => {
      // Auto-drift when no modal is open and not paused
      if (activeFrameRef.current === null && !autoScrollPaused) {
        scrollState.current.target += autoSpeedRef.current;
      }

      // Physical momentum inertia decay
      if (!isDragging) {
        userVelocity *= 0.90;
        scrollState.current.target += userVelocity;
      }

      // Responsive dual-stage lerp
      const lerpFactor = isDragging ? 0.35 : 0.08;
      scrollState.current.current += (scrollState.current.target - scrollState.current.current) * lerpFactor;

      // Accurate DOM offset warp snapping
      const firstCol = colRefs.current[0];
      if (firstCol && firstCol.scrollHeight > 0) {
        let singleSetHeight = firstCol.scrollHeight / 6;
        const totalItems = firstCol.children.length;
        if (totalItems > 0 && totalItems % 6 === 0) {
          const baseLength = totalItems / 6;
          const firstItem = firstCol.children[0];
          const nextSetItem = firstCol.children[baseLength];
          if (firstItem && nextSetItem) {
            singleSetHeight = nextSetItem.offsetTop - firstItem.offsetTop;
          }
        }

        const currentPx = scrollState.current.current * 0.6;
        const threshold = singleSetHeight * 2;
        if (Math.abs(currentPx) > threshold) {
          const snapAmount = singleSetHeight / 0.6;
          const direction = Math.sign(scrollState.current.current);
          scrollState.current.current -= direction * snapAmount;
          scrollState.current.target -= direction * snapAmount;
        }
      }

      // Apply parallax column transforms
      colRefs.current.forEach((col, index) => {
        if (!col) return;
        const direction = index % 2 === 0 ? 1 : -1;
        const baseMiddle = -(col.scrollHeight / 2);
        const delta = scrollState.current.current * 0.6 * direction;
        col.style.transform = `translateY(${baseMiddle + delta}px)`;
      });

      animationFrame = requestAnimationFrame(smoothScroll);
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    panel.addEventListener('touchstart', handleStart, { passive: false });
    panel.addEventListener('touchmove', handleMove, { passive: false });
    panel.addEventListener('touchend', handleEnd);
    panel.addEventListener('touchcancel', handleEnd);
    panel.addEventListener('mousedown', handleStart);
    panel.addEventListener('mousemove', handleMove, { passive: false });
    panel.addEventListener('mouseup', handleEnd);
    panel.addEventListener('mouseleave', handleEnd);

    smoothScroll();

    return () => {
      panel.removeEventListener('wheel', handleWheel);
      panel.removeEventListener('touchstart', handleStart);
      panel.removeEventListener('touchmove', handleMove);
      panel.removeEventListener('touchend', handleEnd);
      panel.removeEventListener('touchcancel', handleEnd);
      panel.removeEventListener('mousedown', handleStart);
      panel.removeEventListener('mousemove', handleMove);
      panel.removeEventListener('mouseup', handleEnd);
      panel.removeEventListener('mouseleave', handleEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div ref={screenRef} className={styles.layout}>
      {/* KIRI: Informasi & Kontrol */}
      <div ref={leftPanelRef} className="panel-left">
        {/* Giant Rotated Bleeding Title */}
        <h2 ref={watermarkRef} className="watermark-sideways">{t('selectCanvasWatermark')}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyItems: 'flex-start', justifyContent: 'flex-start', marginTop: '8rem', marginBottom: 'auto', zIndex: 20 }}>
          <div className="side-display-container">
            <div ref={indicatorRef} className="side-display-bullet">{'▌'}</div>
            <div
              className={styles.modeToggleHitbox}
              onClick={() => setActiveCategory('FRAMES')}
            >
              <div
                ref={frameRefText}
                className={`${styles.modeToggleOption} ${activeCategory === 'FRAMES' ? styles.active : ''}`}
              >
                {t('frames')}
              </div>
            </div>

            <div
              className={styles.modeToggleHitbox}
              onClick={() => setActiveCategory('UPLOAD')}
              style={{ marginTop: '1rem' }}
            >
              <div
                ref={uploadRefText}
                className={`${styles.modeToggleOption} ${activeCategory === 'UPLOAD' ? styles.active : ''}`}
              >
                {t('upload')}
              </div>
            </div>

            {/* Controls under UPLOAD header */}
            {activeCategory === 'UPLOAD' && uploadState.imageSrc && (
              <FrameSlotToolbar
                slots={uploadState.slots}
                activePreset={uploadState.activePreset}
                onApplyPreset={uploadState.handleApplyPreset}
                onAddSlot={uploadState.handleAddSlot}
                onResetSlots={uploadState.handleResetSlots}
                onReplaceImage={uploadState.handleReplaceImage}
              />
            )}
          </div>
        </div>
      </div>

      {/* KANAN: Grid Alternating Scroll or Empty Upload View */}
      <div className="panel-right" style={{ zIndex: 1, touchAction: activeCategory === 'FRAMES' ? 'none' : 'auto' }} ref={rightPanelRef}>
        {activeCategory === 'FRAMES' ? (
          <div className={styles.gridWrapper}>
            {infiniteCols.map((colData, colIndex) => (
              <div
                key={colIndex}
                className={styles.scrollCol}
                ref={el => colRefs.current[colIndex] = el}
                style={{ marginTop: colIndex % 2 !== 0 ? '-150px' : '0' }}
              >
                {colData.map((frame, itemIndex) => {
                  const uniqueId = `${colIndex}-${itemIndex}-${frame.id}`;
                  const isHero = activeFrame === frame.id;
                  const isDimmed = activeFrame !== null && !isHero;

                  return (
                    <div
                      key={uniqueId}
                      className={`${styles.frameCard} ${isHero ? styles.hero : ''} ${isDimmed ? styles.dimmed : ''} ${frame.isPlaceholder ? styles.placeholder : ''}`}
                      onClick={() => {
                        if (frame.isPlaceholder) return;
                        activeFrameRef.current = frame.id;
                        setActiveFrame(frame.id);
                      }}
                    >
                      <EditorialSkeletonFrame
                        src={frame.thumbnail}
                        alt={frame.name}
                        isComingSoon={frame.isPlaceholder}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <FrameUploadWorkspace
            uploadState={uploadState}
            onConfirm={() => uploadState.handleConfirm(onFinish, onPrepareCamera)}
          />
        )}
      </div>

      {/* Preview & Selection Modal */}
      {activeFrame !== null && (() => {
        const selected = filteredFrames.find(f => f.id === activeFrame);
        if (!selected) return null;
        return (
          <div
            className={styles.selectionModal}
            ref={modalOverlayRef}
            onClick={() => { activeFrameRef.current = null; setActiveFrame(null); }}
          >
            <div
              className={styles.modalContent}
              ref={modalContentRef}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.artifactWrapper}>
                <EditorialSkeletonFrame
                  src={selected.thumbnail}
                  alt={selected.name}
                  frame={selected}
                  showHoles={true}
                />
                <div className="vf-corner tl"></div>
                <div className="vf-corner tr"></div>
                <div className="vf-corner bl"></div>
                <div className="vf-corner br"></div>
                <div className="boundary-dashed-line-visual"></div>
              </div>

              <div className={styles.note}>{t('previewTapDismiss')}</div>

              <CtaButton
                onClick={() => {
                  onPrepareCamera?.();
                  handleFinish(activeFrame);
                }}
              >
                {t('confirmSelection')}
              </CtaButton>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const SelectionScreen = (props) => {
  return <SelectionScreenInner {...props} />;
};

export default SelectionScreen;
