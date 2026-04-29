import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ThumbnailOrFallback from '../shared/ThumbnailOrFallback';
import EditorialSkeletonFrame from '../shared/EditorialSkeletonFrame';
import { FRAME_TYPES } from '../../constants/frames';

const SelectionScreen = ({ onFinish }) => {
  const screenRef = useRef(null);
  const rightPanelRef = useRef(null);
  const colRefs = useRef([]);
  const [activeCategory, setActiveCategory] = useState("SPACE"); // SPACE or GRID
  const [activeFrame, setActiveFrame] = useState(null); // Nothing selected on mount

  const scrollState = useRef({ current: 0, target: 0 });
  const indicatorRef = useRef(null);
  const frameRefText = useRef(null);
  const collageRefText = useRef(null);

  useGSAP(() => {
    // Indicator slide
    gsap.to(indicatorRef.current, {
      top: activeCategory === 'GRID' ? '6.1rem' : '0',
      duration: 0.6,
      ease: "elastic.out(1, 0.75)"
    });

    // FRAME Text
    gsap.to(frameRefText.current, {
      x: activeCategory === 'SPACE' ? 0 : '3rem',
      opacity: activeCategory === 'SPACE' ? 1 : 0.3,
      duration: 0.5,
      ease: "power3.out"
    });

    // COLLAGE Text
    gsap.to(collageRefText.current, {
      x: activeCategory === 'GRID' ? 0 : '3rem',
      opacity: activeCategory === 'GRID' ? 1 : 0.3,
      duration: 0.5,
      ease: "power3.out"
    });

    // Right Panel Fade-in - REMOVED OPACITY DROP TO PREVENT "TINT"
    gsap.fromTo(rightPanelRef.current,
      { opacity: 1, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  }, [activeCategory]);

  const handleFinish = (frameId) => {
    const tl = gsap.timeline({
      onComplete: () => onFinish(frameId)
    });

    // 1. Animate modal content out (shrink and fade)
    if (modalContentRef.current) {
      tl.to(modalContentRef.current, {
        scale: 0.9,
        opacity: 0,
        duration: 0.3,
        ease: "back.in(1.2)"
      }, 0);
    }

    // 2. Fade out the overlay backdrop
    if (modalOverlayRef.current) {
      tl.to([modalOverlayRef.current], {
        opacity: 0,
        duration: 0.4,
        ease: "power2.in"
      }, 0.1);
    }

    // 3. Elements slide out
    tl.to([".panel-left", ".panel-right"], {
      x: -100,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      stagger: 0.1
    }, 0.2);
  };

  // Modal Animation Logic (Fixes Looping Issue)
  const modalOverlayRef = useRef(null);
  const modalContentRef = useRef(null);
  useGSAP(() => {
    if (activeFrame !== null && modalOverlayRef.current) {
      gsap.fromTo(modalOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(modalContentRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, delay: 0.1, ease: "back.out(1.2)" });
    }
  }, [activeFrame]);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Initial State
    // Forced block in JSX

    // 2. The Master Sequence - HALVED

    // Background Title (Deepest parallax) - HALVED
    tl.from(".watermark-sideways", {
      x: 300,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out"
    }, 0.05);

    // Left Panel UI Elements - HALVED
    tl.from(".hero-h1-container", {
      x: 150,
      opacity: 0,
      duration: 0.65,
      ease: "power3.out"
    }, 0.2);

    // Right Panel (Grid) - Slide from right - HALVED
    tl.from(".panel-right", {
      x: 100,
      opacity: 0,
      duration: 0.75,
      ease: "power3.out"
    }, 0.1);

    // Individual Columns stagger - HALVED
    tl.from(".scroll-col", {
      y: 50,
      opacity: 0,
      duration: 0.6,
      stagger: 0.05,
      ease: "power2.out"
    }, 0.25);

  }, { scope: screenRef });

  // Filter & Generate Columns
  const filteredFrames = React.useMemo(() => {
    const base = FRAME_TYPES.filter(f => f.category === activeCategory);
    const minItems = 6;
    if (base.length < minItems) {
      const placeholders = Array.from({ length: minItems - base.length }).map((_, i) => ({
        id: `placeholder-${i}`,
        isPlaceholder: true,
        thumbnail: null,
        name: "Coming Soon",
        slots: 1
      }));
      return [...base, ...placeholders];
    }
    return base;
  }, [activeCategory]);

  const infiniteCols = React.useMemo(() => {
    const cols = Array.from({ length: 4 }).map((_, colIndex) => {
      const base = [...filteredFrames.slice(colIndex), ...filteredFrames.slice(0, colIndex)];
      let massiveArray = [];
      for (let i = 0; i < 10; i++) massiveArray = massiveArray.concat(base);
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

      colRefs.current.forEach((col, index) => {
        if (!col) return;
        const direction = index % 2 === 0 ? 1 : -1;
        col.style.transform = `translateY(${scrollState.current.current * direction * 0.6}px)`;
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
  }, []); // Only once, uses refs for all dynamic values


  return (
    <div ref={screenRef} className="milky-mica-background selection-layout" >
      {/* EXIT OVERLAY */}


      {/* KIRI: Informasi & Kontrol */}
      <div className="panel-left">
        {/* Giant Rotated Bleeding Title */}
        <h2 className="watermark-sideways">SELECT YOUR CANVAS</h2>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyItems: 'flex-start', justifyContent: 'center', zIndex: 20 }}>
          <div className="hero-h1-container">
            <div ref={indicatorRef} className="hero-bullet">{'▌'}</div>
            <div
              ref={frameRefText}
              className={`mode-toggle-option ${activeCategory === 'SPACE' ? 'active' : ''}`}
              onClick={() => setActiveCategory('SPACE')}
            >
              FRAME
            </div>
            <div
              ref={collageRefText}
              className={`mode-toggle-option ${activeCategory === 'GRID' ? 'active' : ''}`}
              onClick={() => setActiveCategory('GRID')}
              style={{ marginTop: '1rem' }}
            >
              COLLAGE
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: Grid Alternating Scroll */}
      <div className="panel-right" style={{ zIndex: -1 }} ref={rightPanelRef}>
        <div className="grid-wrapper">
          {infiniteCols.map((colData, colIndex) => (
            <div
              key={colIndex}
              className="scroll-col"
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
                    className={`frame-card ${isHero ? 'hero' : ''} ${isDimmed ? 'dimmed' : ''} ${frame.isPlaceholder ? 'placeholder' : ''}`}
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
        const selected = FRAME_TYPES.find(f => f.id === activeFrame);
        return (
          <div
            className="frame-preview-overlay"
            ref={modalOverlayRef}
            onClick={() => { activeFrameRef.current = null; setActiveFrame(null); }}
          >
            <div
              className="frame-preview-content"
              ref={modalContentRef}
              onClick={e => e.stopPropagation()}
            >

              <div className="frame-preview-artifact">
                <EditorialSkeletonFrame
                  src={selected.thumbnail}
                  alt={selected.name}
                />
              </div>

              <div className="curator-note">[ PREVIEW ] — TAP OUTSIDE TO DISMISS</div>

              <button
                className="btn-tier-1 "
                onClick={() => handleFinish(activeFrame)}
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

export default SelectionScreen;
