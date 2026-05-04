import React, { useState, useRef, useEffect } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import ThumbnailOrFallback from '../shared/ThumbnailOrFallback';
import EditorialSkeletonFrame from '../shared/EditorialSkeletonFrame';
import { useKioskBoot } from '../../hooks/useKioskBoot';
import KioskIdentitySetup from '../shared/KioskIdentitySetup';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import styles from './02-Selection.module.css';


const SelectionScreenInner = ({ onFinish, onPrepareCamera, kioskData, loading }) => {
  const screenRef = useRef(null);
  const rightPanelRef = useRef(null);
  const colRefs = useRef([]);
  const watermarkRef = useRef(null);
  const leftPanelRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("SPACE"); // SPACE or GRID
  const [activeFrame, setActiveFrame] = useState(null); // Nothing selected on mount

  const scrollState = useRef({ current: 0, target: 0 });
  const indicatorRef = useRef(null);
  const frameRefText = useRef(null);
  const collageRefText = useRef(null);

  useEffect(() => {
    // Indicator slide
    animate(indicatorRef.current, {
      top: activeCategory === 'GRID' ? '6.1rem' : '0',
      duration: 600,
      easing: 'easeOutElastic(1, .75)'
    });

    // FRAME Text
    animate(frameRefText.current, {
      translateX: activeCategory === 'SPACE' ? 0 : '3rem',
      opacity: activeCategory === 'SPACE' ? 1 : 0.3,
      duration: 500,
      easing: 'easeOutCubic'
    });

    // COLLAGE Text
    animate(collageRefText.current, {
      translateX: activeCategory === 'GRID' ? 0 : '3rem',
      opacity: activeCategory === 'GRID' ? 1 : 0.3,
      duration: 500,
      easing: 'easeOutCubic'
    });

    // entranceEditorialLayout(tl, { duration: 800 });

    // Right Panel Fade-in
    animate(rightPanelRef.current, {
      translateY: [15, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuart'
    });
  }, [activeCategory]);

  const handleFinish = (frameId) => {
    const selectedFrameData = filteredFrames.find(f => f.id === frameId);
    const tl = createTimeline({
      onComplete: () => onFinish(selectedFrameData)
    });

    // 1. Animate modal content out (shrink and fade)
    if (modalContentRef.current) {
      tl.add(modalContentRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 300,
        easing: 'easeInBack(1.2)'
      }, 0);
    }

    // 2. Fade out the overlay backdrop
    if (modalOverlayRef.current) {
      tl.add(modalOverlayRef.current, {
        opacity: 0,
        duration: 400,
        easing: 'linear'
      }, 100);
    }

    // 3. BUNDLE: Unified Editorial Exit
    exitEditorialLayout(tl, { duration: 500 });
  };

  // Modal Animation Logic (Fixes Looping Issue)
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

  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // 1. Initial State
    // Forced block in JSX

    // 2. The Master Sequence - HALVED
    // Background Title (Deepest parallax) - HALVED
    entranceEditorialLayout(tl, { duration: 800 });
    // tl.add('.watermark-sideways', {
    //   translateX: [300, 0],
    //   opacity: [0, 0.04],
    //   duration: 1100,
    //   easing: 'easeOutQuart'
    // }, 50);

    // // Left Panel UI Elements - HALVED
    // tl.add('.panel-left', {
    //   translateX: [150, 0],
    //   opacity: [0, 1],
    //   duration: 650,
    //   easing: 'easeOutCubic'
    // }, 200);

    // // Right Panel (Grid) - Slide from right
    // tl.add('.panel-right', {
    //   translateX: [100, 0],
    //   opacity: [0, 1],
    //   duration: 750,
    //   easing: 'easeOutCubic'
    // }, 100);

    // Individual Columns stagger - Removed redundant opacity to prevent blinking
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

  // Filter & Generate Columns
  const filteredFrames = React.useMemo(() => {
    // 0. If still booting, show skeletons
    if (loading) {
      return Array.from({ length: 8 }).map((_, i) => ({
        id: `skeleton-${i}`,
        isLoading: true,
        thumbnail: null,
        name: "Loading...",
        slots: 1
      }));
    }

    // 1. Get frames from backend
    const backendFrames = kioskData?.frames?.map(f => ({
      id: f.id,
      category: f.category || 'SPACE',
      thumbnail: f.asset_path,
      name: f.name,
      slots: f.slots || 1,
      slots_config: f.slots_config // Preserve punchhole config from backend
    })) || [];

    // 2. Add Hardcoded "Bonus" Frames (Dev / Basic)
    const bonusFrames = [
      {
        id: 'bonus-basic',
        category: 'SPACE',
        thumbnail: '/frames/default.png',
        name: 'polaroid',
        slots: 1
      },
      {
        id: 'bonus-collage',
        category: 'GRID',
        thumbnail: '/collage/default.png',
        name: 'pinterest style',
        slots: 4
      }
    ];

    // 3. Combine and Filter by Active UI Category (SPACE vs GRID)
    const combined = [...backendFrames, ...bonusFrames];
    const filtered = combined.filter(f => f.category === activeCategory);

    // 4. Always add a few placeholders for "Marketing Gimmick" 
    // and ensure we have at least 6 items for the infinite loop stability
    const placeholderCount = Math.max(2, 6 - filtered.length);
    const placeholders = Array.from({ length: placeholderCount }).map((_, i) => ({
      id: `placeholder-${i}`,
      isPlaceholder: true,
      thumbnail: null,
      name: "Coming Soon",
      slots: 1
    }));

    return [...filtered, ...placeholders];
  }, [activeCategory, kioskData, loading]);

  const infiniteCols = React.useMemo(() => {
    const cols = Array.from({ length: 4 }).map((_, colIndex) => {
      const base = [...filteredFrames.slice(colIndex), ...filteredFrames.slice(0, colIndex)];
      let massiveArray = [];
      for (let i = 0; i < 6; i++) massiveArray = massiveArray.concat(base);
      return massiveArray;
    });
    return cols;
  }, [filteredFrames]);

  // Reset scroll on category change
  useEffect(() => {
    scrollState.current.target = 0;
    scrollState.current.current = 0;
    setActiveFrame(null);
  }, [activeCategory]);

  // Mirror activeFrame in a ref so the rAF loop can read it without stale closure
  const activeFrameRef = useRef(null);
  const autoSpeedRef = useRef(1.2); // px/frame constant drift

  useEffect(() => {
    const panel = rightPanelRef.current;
    if (!panel) return;

    let animationFrame;
    let isDragging = false;
    let startY = 0;
    let userVelocity = 0; // inertia from physical input

    const handleWheel = (e) => {
      e.preventDefault();
      userVelocity += e.deltaY * 0.4;
    };

    const handleStart = (e) => {
      isDragging = true;
      userVelocity = 0;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const delta = (startY - currentY) * 2.5;
      userVelocity = delta;
      scrollState.current.target += delta;
      startY = currentY;
    };

    const handleEnd = () => { isDragging = false; };

    const smoothScroll = () => {
      // Auto-roll: keep drifting while no frame is selected
      if (activeFrameRef.current === null) {
        scrollState.current.target += autoSpeedRef.current;
      }

      // Physical inertia: decay velocity and add to target each frame
      if (!isDragging) {
        userVelocity *= 0.90;
        scrollState.current.target += userVelocity;
      }

      scrollState.current.current += (scrollState.current.target - scrollState.current.current) * 0.08;

      // WARP LOOP: Only snap after 2 full sets to make it infrequent
      const firstCol = colRefs.current[0];
      if (firstCol && firstCol.scrollHeight > 0) {
        const singleSetHeight = firstCol.scrollHeight / 6;
        const currentPx = scrollState.current.current * 0.6;
        //tweak the snap
        const threshold = singleSetHeight * 2;
        if (Math.abs(currentPx) > threshold) {
          const snapAmount = singleSetHeight / 0.6;
          const direction = Math.sign(scrollState.current.current);
          scrollState.current.current -= direction * snapAmount;
          scrollState.current.target -= direction * snapAmount;
        }
      }

      colRefs.current.forEach((col, index) => {
        if (!col) return;
        const direction = index % 2 === 0 ? 1 : -1;

        // BASE CENTER: Start every stick at its own middle (set 3 of 6)
        const baseMiddle = -(col.scrollHeight / 2);

        // APPLY DELTA: Add or subtract based on direction
        const delta = scrollState.current.current * 0.6 * direction;

        col.style.transform = `translateY(${baseMiddle + delta}px)`;
      });

      animationFrame = requestAnimationFrame(smoothScroll);
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    panel.addEventListener('touchstart', handleStart, { passive: false });
    panel.addEventListener('touchmove', handleMove, { passive: false });
    panel.addEventListener('touchend', handleEnd);
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
      panel.removeEventListener('mousedown', handleStart);
      panel.removeEventListener('mousemove', handleMove);
      panel.removeEventListener('mouseup', handleEnd);
      panel.removeEventListener('mouseleave', handleEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, [onPrepareCamera]); // Only once, uses refs for all dynamic values


  return (
    <div ref={screenRef} className={styles.layout} >
      {/* EXIT OVERLAY */}


      {/* KIRI: Informasi & Kontrol */}
      <div ref={leftPanelRef} className="panel-left">
        {/* Giant Rotated Bleeding Title */}
        <h2 ref={watermarkRef} className="watermark-sideways">SELECT YOUR CANVAS</h2>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyItems: 'flex-start', justifyContent: 'center', zIndex: 20 }}>
          <div className="side-display-container">
            <div ref={indicatorRef} className="side-display-bullet">{'▌'}</div>
            <div
              className={styles.modeToggleHitbox}
              onClick={() => setActiveCategory('SPACE')}
            >
              <div
                ref={frameRefText}
                className={`${styles.modeToggleOption} ${activeCategory === 'SPACE' ? styles.active : ''}`}
              >
                FRAME
              </div>
            </div>

            <div
              className={styles.modeToggleHitbox}
              onClick={() => setActiveCategory('GRID')}
              style={{ marginTop: '1rem' }}
            >
              <div
                ref={collageRefText}
                className={`${styles.modeToggleOption} ${activeCategory === 'GRID' ? styles.active : ''}`}
              >
                COLLAGE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Grid Alternating Scroll */}
      <div className="panel-right" style={{ zIndex: 1 }} ref={rightPanelRef}>
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

      </div>

      {/* Glass Backdrop Overlay (Moved to top level to cover both panels) */}
      {activeFrame !== null && (() => {
        const selected = filteredFrames.find(f => f.id === activeFrame);
        if (!selected) return null;
        return (
          <div
            className={`${styles.selectionModal} milky-mica-background`}
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
                />
                <div className="vf-corner tl"></div>
                <div className="vf-corner tr"></div>
                <div className="vf-corner bl"></div>
                <div className="vf-corner br"></div>
                <div className="boundary-dashed-line-visual"></div>
              </div>

              <div className={styles.note}>[ PREVIEW ] — TAP OUTSIDE TO DISMISS</div>

              <button
                className="btn-tier-1"
                onClick={() => {
                  onPrepareCamera?.();
                  handleFinish(activeFrame);
                }}
              >
                CONFIRM SELECTION
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

const SelectionScreen = (props) => {
  const { kioskData, loading, error } = useKioskBoot();
  const [showSetupManual, setShowSetupManual] = useState(false);

  return <SelectionScreenInner kioskData={kioskData || { frames: [] }} loading={loading} {...props} />;
};

export default SelectionScreen;
