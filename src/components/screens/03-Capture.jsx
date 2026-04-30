import React, { useState, useRef, useEffect, startTransition } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import RunningTimestamp from '../shared/RunningTimestamp';
import InteractivePhoto from '../shared/InteractivePhoto';
import CollageComposer from '../shared/CollageComposer';

const CaptureScreen = React.forwardRef(({
  selectedFrame,
  onBack,
  onFinish,
  setCaptureSubState,
  kioskId,
  devMode,
  photos,
  setPhotos,
  isFinished,
  setIsFinished,
  selectedFilter,
  setSelectedFilter,
  isMirrored,
  setIsMirrored,
  currentSlotIndex,
  setCurrentSlotIndex,
  // Camera props — managed externally by App.jsx
  cameraStream,
  cameraDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  onEnsureCamera,
}, ref) => {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const canvasRef = useRef(null);
  const composerRef = useRef(null);
  const watermarkRef = useRef(null);
  const filterListRef = useRef(null);
  const magneticAnchorRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // Background (Subtle scale in)
    tl.add('.camera-feed-background', {
      filter: ['blur(20px)', 'blur(0px)'],
      duration: 900,
      easing: 'easeOutQuad'
    }, 0);

    // Parallax Slide-in from Right to Left
    // Ghost Watermark (Deepest parallax - starts furthest right)
    tl.add('.ghost-capture-watermark', {
      translateX: [300, 0],
      opacity: [0, 0.2],
      duration: 1200,
      easing: 'easeOutQuart'
    }, 50);

    // Optical Grid (Mid-depth)
    tl.add('.optical-grid-system', {
      translateX: [100, 0],
      opacity: [0, 1],
      duration: 750,
      easing: 'easeOutCubic'
    }, 300);

    // HUD Elements (Foreground parallax)
    tl.add('.hud-anchor.top-left', {
      translateX: [150, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad'
    }, 400);

    tl.add('.hud-anchor.center-left', {
      translateX: [200, 0],
      translateY: ['-50%', '-50%'],
      opacity: [0, 1],
      duration: 650,
      easing: 'easeOutQuad'
    }, 500);

    tl.add('.hud-anchor.bottom-right', {
      translateX: [100, 0],
      opacity: [0, 1],
      duration: 550,
      easing: 'easeOutQuad'
    }, 600);

    // Viewfinder Entrance Overlay (Milky Mica Fade-out)
    tl.add('.viewfinder-entrance-overlay', {
      opacity: [1, 0],
      duration: 400,
      easing: 'easeInOutQuad',
      onComplete: () => {
        const el = document.querySelector('.viewfinder-entrance-overlay');
        if (el) el.style.display = 'none';
      }
    }, 0);

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  const deviceList = cameraDevices || [];

  // Status Sesi Capture
  const [timerDelay, setTimerDelay] = useState(devMode ? 0 : 3);

  useEffect(() => {
    setTimerDelay(devMode ? 0 : 3);
  }, [devMode]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);
  const timerIntervalRef = useRef(null);
  // State lifted to App.jsx: photos, currentSlotIndex, selectedFilter, isMirrored, isFinished
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState(null);
  const [showFreezeFrame, setShowFreezeFrame] = useState(false);
  const [frameRatio, setFrameRatio] = useState(1);
  const [showCamDropdown, setShowCamDropdown] = useState(false);
  const audioRef = useRef(null);

  // Pagination Sub-state tracking
  useEffect(() => {
    if (isFinished && !isCapturing) {
      setCaptureSubState('compositing');
    } else {
      setCaptureSubState('viewfinder');
    }
  }, [isFinished, isCapturing, setCaptureSubState]);

  // Compositing Panel Parallax Entrance
  useEffect(() => {
    if (isFinished && !isCapturing) {
      const tl = createTimeline();

      // We want the milky-mica-background (compositing-panel) to fade in
      tl.add('.compositing-panel', {
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
      }, 0);

      // Parallax slide-in
      tl.add('.watermark-sideways', {
        translateX: [300, 0],
        opacity: [0, 0.04],
        duration: 1100,
        easing: 'easeOutQuart'
      }, 50);

      tl.add('.panel-left', {
        translateX: [150, 0],
        opacity: [0, 1],
        duration: 650,
        easing: 'easeOutCubic'
      }, 150);

      tl.add('.panel-right', {
        translateX: [80, 0],
        opacity: [0, 1],
        duration: 750,
        easing: 'easeOutCubic'
      }, 200);

      // Staggered filter buttons
      tl.add('.btn-filter-editorial', {
        translateX: [30, 0],
        opacity: [0, 1],
        duration: 500,
        delay: stagger(40),
        easing: 'easeOutQuad'
      }, 550);
    }
  }, [isFinished, isCapturing]);

  // Magnetic Anchor Movement
  useEffect(() => {
    if (magneticAnchorRef.current && filterListRef.current) {
      const activeBtn = filterListRef.current.querySelector('.btn-filter-editorial.active');
      if (activeBtn) {
        animate(magneticAnchorRef.current, {
          translateY: activeBtn.offsetTop + (activeBtn.offsetHeight / 2) - 12,
          duration: 600,
          easing: 'easeOutElastic(1, .7)'
        });
      }
    }
  }, [selectedFilter, isFinished, isCapturing]);

  // Load frame ratio
  useEffect(() => {
    if (selectedFrame?.thumbnail) {
      const img = new Image();
      img.src = selectedFrame.thumbnail;
      img.onload = () => {
        setFrameRatio(img.naturalWidth / img.naturalHeight);
      };
    }
  }, [selectedFrame]);

  // Attach external stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Viewfinder fallback: proactively check if camera is alive while in viewfinder
  useEffect(() => {
    // Only monitor if we are not finished and not currently in the middle of a capture sequence
    if (isFinished) return;

    const checkAndFire = () => {
      const video = videoRef.current;
      if (!video) return;

      const isLive = video.srcObject &&
        video.srcObject.active &&
        video.readyState >= 2;

      if (!isLive && typeof onEnsureCamera === 'function') {
        console.warn('[CaptureScreen] Camera not live in viewfinder — firing recovery.');
        onEnsureCamera();
      }
    };

    // Initial check after mount/state change
    const initialTimeout = setTimeout(checkAndFire, 1000);

    // Periodic health check every 3 seconds
    const interval = setInterval(checkAndFire, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isFinished, onEnsureCamera]);

  const startSequence = () => {
    if (isCapturing || photos.length > 0) return;
    setIsCapturing(true);
    setCurrentSlotIndex(0);
    setPhotos([]);
    captureNext(0);
  };

  const captureNext = (slotIdx) => {
    if (slotIdx >= selectedFrame.slots) {
      setIsCapturing(false);
      setCountdown(null);
      setIsFinished(true); // Signal the end of capture sequence
      return;
    }

    let timeLeft = timerDelay;
    if (timeLeft === 0) {
      takeSnapshot(slotIdx);
    } else {
      setCountdown(timeLeft);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      
      timerIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          setCountdown(null);
          takeSnapshot(slotIdx);
        } else {
          setCountdown(timeLeft);
        }
      }, 1000);
    }
  };

  // Animate countdown "punch" when number changes
  useEffect(() => {
    if (countdown !== null) {
      animate('.elegant-countdown-number', {
        scale: [1.5, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack'
      });
    }
  }, [countdown]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const takeSnapshot = (slotIdx) => {
    // Shutter Flash Sequence
    const flash = document.createElement('div');
    flash.className = 'shutter-flash-overlay';
    document.body.appendChild(flash);

    // Flash the Ghost Watermark punch: Fill white then back to ghost
    if (watermarkRef.current) {
      animate(watermarkRef.current, {
        color: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)'],
        opacity: [0.2, 0.8, 0.2],
        duration: 500,
        easing: 'easeOutQuad'
      });
    }

    animate(flash, {
      opacity: [0, 1],
      duration: 50,
      easing: 'linear',
      onComplete: () => {
        animate(flash, {
          opacity: 0,
          duration: 400,
          easing: 'easeOutQuad',
          onComplete: () => flash.remove()
        });
      }
    });


    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Check if video is actually ready and has dimensions
      const isReady = video.readyState >= 3 && video.videoWidth > 0 && video.videoHeight > 0;

      let dataUrl;
      if (isReady) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      } else {
        console.warn("Camera not ready, using fallback image.");
        dataUrl = "/taken_pic/default.png";
      }

      setPhotos(prev => {
        const newPhotos = [...prev, dataUrl];
        setLastCapturedPhoto(dataUrl);
        setShowFreezeFrame(true);
        setCurrentSlotIndex(slotIdx + 1);

        setTimeout(() => {
          setShowFreezeFrame(false);
          captureNext(slotIdx + 1);
        }, 1500);

        return newPhotos;
      });
    }
  };

  // Telemetry logic
  const activeCamera = deviceList.find(d => d.deviceId === selectedDeviceId);
  const isProfessionalSource = activeCamera?.label?.toLowerCase().includes('canon') || activeCamera?.label?.toLowerCase().includes('dslr');
  const telemetryString = isProfessionalSource ? "ISO_3200 // F1.4 // S_1/125" : "AUTO_EXP // DGT_LENS";

  const handleRetake = () => {
    startTransition(() => {
      setPhotos([]);
      setCurrentSlotIndex(0);
      setIsFinished(false);
      setSelectedFilter('none');
    });
  };

  React.useImperativeHandle(ref, () => ({
    retake: handleRetake
  }));

  const handleExport = async () => {
    if (composerRef.current && canvasRef.current) {
      const tl = createTimeline();

      // Parallax exit — elements slide left at different depths
      tl.add('.watermark-sideways', {
        translateX: -200,
        opacity: [0.04, 0],
        duration: 550,
        easing: 'easeInQuart'
      }, 0);

      tl.add('.panel-left', {
        translateX: -100,
        opacity: 0,
        duration: 400,
        easing: 'easeInQuad'
      }, 50);

      tl.add('.panel-right', {
        translateX: -60,
        opacity: 0,
        duration: 400,
        easing: 'easeInQuad'
      }, 100);

      // Flash to overlay
      tl.add('.page-exit-overlay', {
        opacity: [0, 1],
        duration: 300,
        easing: 'linear'
      }, '-=200');


      const comp = composerRef.current.getComposition();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Force high-fidelity export
      canvas.width = comp.cW * 2;
      canvas.height = comp.cH * 2;
      ctx.scale(2, 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = "rgb(var(--theme-surface-dark-rgb))";
      ctx.fillRect(0, 0, comp.cW, comp.cH);

      // PERFECT ALIGNMENT FIX: Clip all photo layers to the frame container
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, comp.cW, comp.cH);
      ctx.clip();

      // Branch based on composition type
      if (comp.isCollage) {
        // Draw all photos in order
        for (const photoData of comp.photos) {
          const photoImg = new Image();
          photoImg.src = photoData.src;
          await new Promise(r => photoImg.onload = r);
          ctx.save();
          ctx.filter = comp.photoFilter;
          if (comp.isMirrored) {
            ctx.translate(Math.round(photoData.x + photoData.w), Math.round(photoData.y));
            ctx.scale(-1, 1);
            ctx.drawImage(photoImg, 0, 0, Math.round(photoData.w), Math.round(photoData.h));
          } else {
            ctx.drawImage(photoImg, Math.round(photoData.x), Math.round(photoData.y), Math.round(photoData.w), Math.round(photoData.h));
          }
          ctx.restore();
        }
      } else {
        // Draw single photo (Legacy Adaptive Logic)
        const photoImg = new Image();
        photoImg.src = comp.src;
        await new Promise(r => photoImg.onload = r);
        ctx.save();
        ctx.filter = comp.photoFilter;
        if (comp.isMirrored) {
          ctx.translate(Math.round(comp.x + comp.w), Math.round(comp.y));
          ctx.scale(-1, 1);
          ctx.drawImage(photoImg, 0, 0, Math.round(comp.w), Math.round(comp.h));
        } else {
          ctx.drawImage(photoImg, Math.round(comp.x), Math.round(comp.y), Math.round(comp.w), Math.round(comp.h));
        }
        ctx.restore();
      }

      ctx.restore(); // End clipping

      const frameImg = new Image();
      frameImg.src = selectedFrame.thumbnail;
      await new Promise(r => frameImg.onload = r);
      ctx.drawImage(frameImg, 0, 0, Math.round(comp.cW), Math.round(comp.cH));

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      tl.add({
        duration: 1,
        onComplete: () => onFinish(dataUrl)
      });
    }
  };

  return (
    <div ref={screenRef} className="capture-viewport-container">
      {/* VIEW FINDER ENTRANCE OVERLAY (Milky Mica) */}
      <div className="viewfinder-entrance-overlay milky-mica-background" style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        pointerEvents: 'none'
      }}></div>

      {/* EXIT OVERLAY */}
      <div className="page-exit-overlay" style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#050505',
        opacity: 0,
        zIndex: 10000,
        pointerEvents: 'none'
      }}></div>


      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto"></audio>

      {/* THE CAMERA FEED */}
      <video ref={videoRef} autoPlay playsInline muted className="camera-feed-background" />

      {/* THE OPTICAL GRID */}
      <div className="optical-grid-system">
        <div className="grid-quadrant-line horizontal"></div>
        <div className="grid-quadrant-line vertical"></div>
        {countdown === null && (
          <div className="grid-center-crosshair">
            <div className="crosshair-h"></div>
            <div className="crosshair-v"></div>
          </div>
        )}
      </div>

      {/* GHOST WATERMARK: CAPTURE */}
      <div ref={watermarkRef} className="ghost-capture-watermark">
        VIEWFINDER
      </div>

      {/* MAIN HUD WRAPPER */}
      <div
        className={`main-hud-wrapper ${!isCapturing && photos.length === 0 ? 'interactive-trigger' : ''}`}
        onClick={startSequence}
      >
        {/* TOP-LEFT: STATUS & TELEMETRY */}
        <div className="hud-anchor top-left" onClick={e => e.stopPropagation()}>
          <div className="telemetry-data">
            {telemetryString}
            <div className="dslr-status-indicator" style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.8 }}>
              DSLR_LINK: <span style={{ color: isProfessionalSource ? 'rgb(var(--theme-accent-rgb))' : "rgba(255,255,255,0.4)" }}>
                [{isProfessionalSource ? 'OK' : 'NOT FOUND'}]
              </span>
            </div>
          </div>

          {/* MINIMALIST CAMERA SELECTOR */}
          {!isCapturing && photos.length === 0 && (
            <div className="viewfinder-selector-minimal" style={{ marginTop: '0.8rem' }}>
              <div className="telemetry-data" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                VIEWFINDER_SOURCE:
                <span
                  className="minimal-dropdown-trigger"
                  onClick={() => setShowCamDropdown(!showCamDropdown)}
                  style={{
                    color: 'rgb(var(--theme-accent-rgb))',
                    cursor: 'pointer',
                    marginLeft: '0.5rem',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px'
                  }}
                >
                  [{deviceList.find(d => d.deviceId === selectedDeviceId)?.label.split('(')[0].trim() || 'SELECT SOURCE'}]
                </span>
              </div>

              {showCamDropdown && (
                <div className="minimal-cam-dropdown-list">
                  {deviceList.map((device, idx) => (
                    <div
                      key={device.deviceId}
                      className={`minimal-dropdown-item ${selectedDeviceId === device.deviceId ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDeviceId(device.deviceId);
                        setShowCamDropdown(false);
                      }}
                    >
                      {device.label.split('(')[0].trim() || `SOURCE_0${idx + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEFT AXIS: THE GIANT TIMER MENU */}
        <div className="hud-anchor center-left" onClick={e => e.stopPropagation()}>
          <div
            className="giant-timer-axis"
            style={{ transform: `translateY(${(3 - ['-', '-', 0, 3, 5, '-', '-'].indexOf(timerDelay)) * 5.9}rem)` }}
          >
            {['-', '-', 0, 3, 5, '-', '-'].map((t, idx) => {
              const isNumeric = typeof t === 'number';
              const activeIndex = ['-', '-', 0, 3, 5, '-', '-'].indexOf(timerDelay);
              const dist = Math.abs(idx - activeIndex);
              const opacity = Math.max(0.02, 1 - dist * 0.35);

              // Shift calculation: Active = fully left, neighbors = half-way, others = right-aligned
              const translateX = dist === 0 ? '0rem' : dist === 1 ? '-1.5rem' : '-3rem';

              // Only start blurring after 2 steps away from the center
              const blurAmount = dist > 0 ? (dist - 0) * 2 : 0;

              return (
                <div
                  key={idx}
                  className={`timer-menu-item ${timerDelay === t ? 'active' : ''} ${!isNumeric ? 'unselectable' : ''}`}
                  onClick={() => isNumeric && setTimerDelay(t)}
                  style={{
                    opacity,
                    transform: `translateX(${translateX})`,
                    pointerEvents: isNumeric ? 'auto' : 'none',
                    filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none'
                  }}
                >
                  <span className="timer-num">{t}</span>
                  {isNumeric && <span className="timer-unit">SEC</span>}
                  {timerDelay === t && <div className="timer-dna-accent"></div>}
                </div>
              );
            })}
          </div>
        </div>




        {/* BOTTOM-RIGHT: FRAME INDEX */}
        <div className="hud-anchor bottom-right">
          <div className="frame-index-display">
            {Math.min(photos.length + 1, selectedFrame.slots)} / {selectedFrame.slots}
          </div>
          <div className="session-serial-detail">
            SYS.KERN_V4.2 // {kioskId} // {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* CENTER: TAP ANYWHERE CTA */}
        {!isCapturing && photos.length === 0 && countdown === null && (
          <div className="hud-anchor absolute-center" style={{ opacity: 1 }}>
            <div className="tap-capture-cta">
              <span className="cta-default">TAP ANYWHERE TO CAPTURE</span>
            </div>
          </div>
        )}

        {/* ELEGANT CENTER COUNTDOWN */}
        {countdown !== null && (
          <div className="hud-anchor absolute-center" style={{ opacity: 1 }}>
            <div className="elegant-countdown-number">{countdown}</div>
          </div>
        )}
      </div>

      {/* FX OVERLAYS */}
      <div className="hud-vignette"></div>
      <div className="hud-scanlines-subtle"></div>

      {/* MICRO-REVIEW */}
      {
        showFreezeFrame && lastCapturedPhoto && (
          <div className="freeze-frame-hud">
            <img src={lastCapturedPhoto || "/taken_pic/default.png"} alt="Freeze" className="freeze-img-hud" />
            <div className="freeze-scanline"></div>
          </div>
        )
      }

      {/* RESULT OVERLAY */}
      {
        isFinished && !isCapturing && photos.length > 0 && (() => {


          const FILTERS = [
            { label: 'RAW', value: 'none' },
            { label: 'MONO', value: 'grayscale(100%) contrast(1.1)' },
            { label: 'NOIR', value: 'grayscale(100%) brightness(0.85) contrast(1.4)' },
            { label: 'FADE', value: 'brightness(1.15) contrast(0.8) saturate(0.7)' },
            { label: 'COLD', value: 'hue-rotate(200deg) saturate(1.2) brightness(1.05)' },
            { label: 'WARM', value: 'hue-rotate(-20deg) saturate(1.4) brightness(1.05)' },
            { label: 'VIVID', value: 'saturate(2) contrast(1.1)' },
            { label: 'CYBER', value: 'hue-rotate(180deg) saturate(3) contrast(1.2) brightness(1.1)' },
            { label: 'SEPIA', value: 'sepia(80%) contrast(1.05)' },
          ];

          return (
            <div className="milky-mica-background compositing-panel">
              {/* Compositing Entrance Flash Overlay (Kept for optional additional pop, but logic now favors mica fade) */}
              <div className="comp-entrance-overlay" style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'white',
                opacity: 0,
                zIndex: 9999,
                pointerEvents: 'none',
                display: 'none'
              }}></div>

              <div className="panel-left">
                {/* Vertical Watermark — separate ref for deepest parallax */}
                <h2 className="watermark-sideways">CURATE</h2>

                <div style={{ width: '100%', marginTop: '8rem', zIndex: 20 }}>
                  {/* Hero Title with Cyan Overlap */}
                  <div className="hero-h1-container">
                    <div className="hero-bullet">▌</div>
                    <h2 className="hero-h1">COMPOSITING</h2>
                  </div>

                  <div className="instructions-list">
                    {/* Step 1 */}
                    <div className="comp-instruction-step">
                      <span className="comp-instruction-num">01.</span>
                      <div className="comp-instruction-content">
                        <span className="comp-section-label">CHOOSE YOUR LENS PROFILE.</span>
                        <div className="filter-list-editorial" ref={filterListRef}>
                          <div className="magnetic-anchor-cyan" ref={magneticAnchorRef}>▌</div>
                          {FILTERS.map(f => (
                            <button
                              key={f.label}
                              onClick={() => {
                                if (f.value === selectedFilter) return;
                                setIsProcessingFilter(true);
                                setTimeout(() => {
                                  setSelectedFilter(f.value);
                                }, 150); // Change filter at peak blur
                                setTimeout(() => {
                                  setIsProcessingFilter(false);
                                }, 500);
                              }}
                              className={`btn-filter-editorial ${selectedFilter === f.value ? 'active' : ''} ${isProcessingFilter ? 'processing' : ''}`}
                              disabled={isProcessingFilter}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="comp-instruction-step">
                      <span className="comp-instruction-num">02.</span>
                      <div className="comp-instruction-content">
                        <span className="comp-section-label">ADJUST FRAME ORIENTATION.</span>
                        <div
                          className="btn-transform-minimal"
                          onClick={() => setIsMirrored(!isMirrored)}
                        >
                          <span className="transform-label">MIRRORED</span>
                          <div className={`minimal-switch ${isMirrored ? 'active' : ''}`}>
                            <div className="switch-line"></div>
                            <div className="switch-dot"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    {photos.length > 1 && (
                      <div className="comp-instruction-step">
                        <span className="payment-instruction-num">03.</span>
                        <div className="comp-instruction-content">
                          <span className="comp-section-label">MANAGE COMPOSITION LAYERS.</span>
                          <p className="payment-instruction-text">
                            USE THE LAYER SELECTOR ON THE LEFT OF THE CANVAS TO SWITCH BETWEEN CAPTURES.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="panel-right panel-center-content">
                <div className="canvas-greebles-right">RENDER_SIZE: 14.2MB // PRINT_QUEUE: READY // DPI: 300</div>
                <div className="canvas-status-footer">
                  <span>SYS.KERN_v4.2.1-EX</span>
                  <RunningTimestamp />
                  <span>BUFFER_LOADED: 100%</span>
                </div>
                <div className="frame-floating-container">
                  {selectedFrame.slots > 1 ? (
                    <CollageComposer
                      ref={composerRef}
                      photos={photos}
                      frameSrc={selectedFrame.thumbnail}
                      photoFilter={selectedFilter}
                      isMirrored={isMirrored}
                      isProcessing={isProcessingFilter}
                    />
                  ) : (
                    <InteractivePhoto
                      ref={composerRef}
                      src={photos[0]}
                      frameSrc={selectedFrame.thumbnail}
                      photoFilter={selectedFilter}
                      isMirrored={isMirrored}
                      isProcessing={isProcessingFilter}
                    />
                  )}
                </div>
                <div className="finalize-action-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                  <button className="btn-tier-1" onClick={handleExport}>
                    PRINT COMPOSITION
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      }
    </div >
  );
});

export default CaptureScreen;
