import React, { useState, useRef, useEffect, startTransition } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import RunningTimestamp from '../shared/RunningTimestamp';
import InteractivePhoto from '../shared/InteractivePhoto';
import CollageComposer from '../shared/CollageComposer';
import { getFrameLayout } from '../../constants/frame_layouts';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import { TRANSLATIONS } from '../../constants/translations';
import { SecondaryButton, CtaButton } from '../../ui';
import vfStyles from './03a-Viewfinder.module.css';
import cpStyles from './03b-Compositing.module.css';
import { assetUrl } from '../../utils/assetUrl';





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
  language = 'EN',
}, ref) => {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const canvasRef = useRef(null);
  const composerRef = useRef(null);
  const watermarkRef = useRef(null);
  const filterListRef = useRef(null);
  const magneticAnchorRef = useRef(null);
  const timelineRef = useRef(null);
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };
  const gridSystemRef = useRef(null);
  const hudTopLeftRef = useRef(null);
  const hudCenterLeftRef = useRef(null);
  const hudBottomRightRef = useRef(null);
  const entranceOverlayRef = useRef(null);
  const compositingPanelRef = useRef(null);
  const countdownTextRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // Background (Subtle scale in)
    if (videoRef.current) {
      tl.add(videoRef.current, {
        filter: ['blur(20px)', 'blur(0px)'],
        duration: 900,
        easing: 'easeOutQuad'
      }, 0);
    }

    // Parallax Slide-in from Right to Left (REMOVED)

    // Viewfinder Entrance Overlay (Milky Mica Fade-out)
    if (entranceOverlayRef.current) {
      tl.add(entranceOverlayRef.current, {
        opacity: [1, 0],
        duration: 400,
        easing: 'easeInOutQuad',
        onComplete: () => {
          if (entranceOverlayRef.current) entranceOverlayRef.current.style.display = 'none';
        }
      }, 0);
    }

    return () => {
      if (tl) tl.pause();
    };
  }, []);


  const deviceList = cameraDevices || [];

  // Status Sesi Capture
  const [timerDelay, setTimerDelay] = useState(devMode ? 0 : 3);
  const [activeSlots, setActiveSlots] = useState([]);
  const [targetedSlotIndex, setTargetedSlotIndex] = useState(0);
  const [retakeTargetIndex, setRetakeTargetIndex] = useState(null);

  // Initialize activeSlots when frame changes
  useEffect(() => {
    if (selectedFrame?.slots) {
      setActiveSlots(new Array(selectedFrame.slots).fill(true));
    }
  }, [selectedFrame]);

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
  const freezeTimeoutRef = useRef(null);
  const exportTimeoutRef = useRef(null);




  // Re-animate Viewfinder elements when returning from Compositing
  useEffect(() => {
    if (!isFinished && !isCapturing) {
      // Just ensure opacity is 1 if it was lost
      if (gridSystemRef.current) {
        animate(gridSystemRef.current, {
          opacity: 1,
          duration: 400,
          easing: 'linear'
        });
      }
    }
  }, [isFinished, isCapturing]);

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
      if (compositingPanelRef.current) {
        tl.add(compositingPanelRef.current, {
          opacity: [0, 1],
          duration: 800,
          easing: 'easeOutQuad'
        }, 0);
      }

      entranceEditorialLayout(tl, { duration: 800 });

    }
  }, [isFinished, isCapturing]);

  // Magnetic Anchor Movement
  useEffect(() => {
    if (magneticAnchorRef.current && filterListRef.current) {
      const activeBtn = filterListRef.current.querySelector(`.${cpStyles.filterBtn}.${cpStyles.active}`);
      if (activeBtn) {
        animate(magneticAnchorRef.current, {
          translateY: activeBtn.offsetTop + (activeBtn.offsetHeight / 2) - 12,
          translateX: activeBtn.offsetLeft - 16,
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
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
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

    // Initial check after mount/state change with grace period
    const initialTimeout = setTimeout(checkAndFire, 2000);

    // Periodic health check every 3 seconds
    const interval = setInterval(checkAndFire, 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isFinished, onEnsureCamera]);

  const isCapturingRef = useRef(false);
  const startSequence = () => {
    if (isCapturing) return;

    // If no slots are active, and we have some photos, just proceed to compositing
    if (activeSlots.every(s => !s) && photos.some(p => !!p)) {
      setIsFinished(true);
      return;
    }

    isCapturingRef.current = true;
    setIsCapturing(true);

    // If photos already exist, we keep them unless replaced.
    // If no photos exist, we initialize with empty array of correct length.
    if (photos.length === 0) {
      setPhotos(new Array(selectedFrame.slots).fill(null));
    }

    captureNext(0);
  };

  const captureNext = (slotIdx) => {
    // If we were in single-slot retake mode, and we finished capturing the targeted slot,
    // we should stop capturing and return to review mode.
    if (retakeTargetIndex !== null && slotIdx !== retakeTargetIndex) {
      setRetakeTargetIndex(null);
      isCapturingRef.current = false;
      setIsCapturing(false);
      setCountdown(null);
      setIsFinished(true);
      return;
    }

    const totalSlots = selectedFrame?.slots || 1;

    // Find the next active slot
    let nextIdx = -1;
    for (let i = slotIdx; i < totalSlots; i++) {
      if (activeSlots[i]) {
        nextIdx = i;
        break;
      }
    }

    if (nextIdx === -1) {
      isCapturingRef.current = false;
      setIsCapturing(false);
      setCountdown(null);
      setIsFinished(true);
      return;
    }

    setCurrentSlotIndex(nextIdx);

    let timeLeft = timerDelay;
    if (timeLeft === 0) {
      takeSnapshot(nextIdx);
    } else {
      setCountdown(timeLeft);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          setCountdown(null);
          takeSnapshot(nextIdx);
        } else {
          setCountdown(timeLeft);
        }
      }, 1000);
    }
  };

  // Animate countdown "punch" when number changes
  useEffect(() => {
    if (countdown !== null && countdownTextRef.current) {
      animate(countdownTextRef.current, {
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
      if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current);
    };
  }, []);

  const takeSnapshot = async (slotIdx) => {
    // Shutter Flash Sequence
    const flash = document.createElement('div');
    flash.className = vfStyles.shutterFlash;
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
        dataUrl = assetUrl('taken_pic/default.png');
      }

      setPhotos(prev => {
        const next = [...prev];
        next[slotIdx] = dataUrl;
        return next;
      });

      setLastCapturedPhoto(dataUrl);
      setShowFreezeFrame(true);

      if (freezeTimeoutRef.current) clearTimeout(freezeTimeoutRef.current);
      freezeTimeoutRef.current = setTimeout(() => {
        setShowFreezeFrame(false);
        captureNext(slotIdx + 1);
      }, 1500);
    }

  };

  const toggleSlot = (idx) => {
    if (isCapturing) return;
    setActiveSlots(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Telemetry logic
  const telemetryString = "AUTO_EXP // DGT_LENS";


  const triggerRetakeSequence = (targetIdx) => {
    if (isCapturing) return;
    setRetakeTargetIndex(targetIdx);
    setCurrentSlotIndex(targetIdx);
    setIsCapturing(true);
    isCapturingRef.current = true;
    setIsFinished(false);

    // Brief timeout to ensure video/viewfinder elements are rendered before starting sequence
    setTimeout(() => {
      captureNext(targetIdx);
    }, 150);
  };

  const handleRetake = () => {
    startTransition(() => {
      isCapturingRef.current = false;
      setPhotos([]);
      setCurrentSlotIndex(0);
      setIsFinished(false);
      setSelectedFilter('none');
    });
  };

  React.useImperativeHandle(ref, () => ({
    retake: handleRetake,
    export: handleExport,
    triggerRetake: () => {
      if (targetedSlotIndex === -1) return false;
      triggerRetakeSequence(targetedSlotIndex);
      return true;
    }
  }));

  const handleExport = async () => {
    if (composerRef.current && canvasRef.current) {
      const tl = createTimeline();

      // BUNDLE: Unified Editorial Exit
      exitEditorialLayout(tl, { duration: 300 });

      const comp = composerRef.current.getComposition();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const loadImage = (src) => {
        return new Promise((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = (err) => {
            console.warn("Image load fallback for export:", src, err);
            resolve(null);
          };
          img.src = src;
        });
      };

      // Direct, instantaneous parallel image loading
      const [photoImages, frameImg] = await Promise.all([
        Promise.all(comp.photos.map(p => loadImage(p.src))),
        loadImage(selectedFrame.thumbnail)
      ]);

      // High-fidelity export canvas
      canvas.width = comp.cW * 2;
      canvas.height = comp.cH * 2;
      ctx.scale(2, 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.fillStyle = "rgb(21, 21, 21)";
      ctx.fillRect(0, 0, comp.cW, comp.cH);

      // Clip all photo layers to the frame container
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, comp.cW, comp.cH);
      ctx.clip();

      for (let i = 0; i < comp.photos.length; i++) {
        const photoData = comp.photos[i];
        const photoImg = photoImages[i];
        if (!photoData.src || !photoImg) continue;

        ctx.save();
        if (photoData.sW) {
          ctx.beginPath();
          ctx.rect(Math.round(photoData.sX), Math.round(photoData.sY), Math.round(photoData.sW), Math.round(photoData.sH));
          ctx.clip();
        }

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

      ctx.restore(); // End clipping

      if (frameImg) {
        ctx.drawImage(frameImg, 0, 0, Math.round(comp.cW), Math.round(comp.cH));
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

      tl.add({
        duration: 50,
        onComplete: () => {
          onFinish(dataUrl);
        }
      });
    }
  };

  return (
    <div ref={screenRef} className={vfStyles.container}>
      {/* VIEW FINDER ENTRANCE OVERLAY (Milky Mica) */}
      <div ref={entranceOverlayRef} className={`${vfStyles.entranceOverlay} milky-mica-background`}></div>

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
      <video ref={videoRef} autoPlay playsInline muted className={vfStyles.cameraFeed} />


      {/* THE OPTICAL GRID */}
      <div ref={gridSystemRef} className={vfStyles.opticalGrid}>
        <div className={`${vfStyles.gridLine} ${vfStyles.horizontal1}`}></div>
        <div className={`${vfStyles.gridLine} ${vfStyles.horizontal2}`}></div>
        <div className={`${vfStyles.gridLine} ${vfStyles.vertical1}`}></div>
        <div className={`${vfStyles.gridLine} ${vfStyles.vertical2}`}></div>
      </div>

      {/* GHOST WATERMARK: CAPTURE */}
      <div ref={watermarkRef} className={vfStyles.watermark}>
        {t('viewfinderWatermark')}
      </div>

      {/* MAIN HUD WRAPPER */}
      <div
        className={`${vfStyles.hudWrapper} ${!isCapturing ? vfStyles.interactive : ''}`}
        onClick={startSequence}
      >
        {/* TOP-LEFT: STATUS & TELEMETRY */}
        <div ref={hudTopLeftRef} className={`${vfStyles.hudAnchor} ${vfStyles.topLeft}`} onClick={e => e.stopPropagation()}>
          <div className={vfStyles.telemetry}>
            {telemetryString}
          </div>

          {/* MINIMALIST CAMERA SELECTOR */}
          {!isCapturing && (
            <div className={vfStyles.selectorMinimal} style={{ marginTop: '0.8rem' }}>
              <div className={vfStyles.telemetry} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
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
                <div className={vfStyles.dropdownList}>
                  {deviceList.map((device, idx) => (
                    <div
                      key={device.deviceId}
                      className={`${vfStyles.dropdownItem} ${selectedDeviceId === device.deviceId ? vfStyles.active : ''}`}
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
        <div ref={hudCenterLeftRef} className={`${vfStyles.hudAnchor} ${vfStyles.centerLeft}`} onClick={e => e.stopPropagation()}>
          <div
            className={vfStyles.timerAxis}
            style={{ transform: `translateY(${(3 - ['-', '-', 0, 3, 5, '-', '-'].indexOf(timerDelay)) * 5.9}rem)` }}
          >
            {['-', '-', 0, 3, 5, '-', '-'].map((timerVal, idx) => {
              const isNumeric = typeof timerVal === 'number';
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
                  className={`${vfStyles.timerItem} ${timerDelay === timerVal ? vfStyles.active : ''} ${!isNumeric ? vfStyles.unselectable : ''}`}
                  onClick={() => isNumeric && setTimerDelay(timerVal)}
                  style={{
                    opacity,
                    transform: `translateX(${translateX})`,
                    pointerEvents: isNumeric ? 'auto' : 'none',
                    filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none'
                  }}
                >
                  <span className={vfStyles.timerNum}>{timerVal}</span>
                  {isNumeric && <span className={vfStyles.timerUnit}>{t('sec')}</span>}
                  {timerDelay === timerVal && <div className={vfStyles.timerDnaAccent}></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`${vfStyles.photoWheel} ${isFinished ? vfStyles.reviewMode : ''}`}
          onClick={e => e.stopPropagation()}
          style={{
            transform: isCapturing
              ? `translateY(calc(-50% + ${((activeSlots.length + 4 - 1) * 8 / 2) - ((currentSlotIndex + 2) * 8)}rem))`
              : 'translateY(-50%)'
          }}
        >
          {[null, null, ...activeSlots, null, null].map((_, rIdx) => {
            const isSlot = rIdx >= 2 && rIdx < activeSlots.length + 2;
            const slotIdx = isSlot ? rIdx - 2 : -1;
            const isCurrent = isSlot && slotIdx === currentSlotIndex && isCapturing;
            const isTargeted = isSlot && activeSlots[slotIdx] && !isFinished && !isCapturing;
            const isReviewTarget = isFinished && slotIdx === targetedSlotIndex;

            // Focus logic
            const focusIdx = isCapturing ? currentSlotIndex + 2 : -1;
            const dist = isCapturing ? Math.abs(rIdx - focusIdx) : 0;

            // Blur Logic
            let blurAmount = 0;
            if (isCapturing) {
              blurAmount = dist > 0 ? dist * 2 : 0;
            } else {
              // Default state: only dashes are blurred
              blurAmount = isSlot ? 0 : 4;
            }

            // Opacity & Scale
            const opacity = isCapturing
              ? Math.max(0.1, 1 - dist * 0.4)
              : (isSlot ? 1 : 0.2);

            const scale = isCurrent ? 1.05 : (isCapturing ? 0.85 : 1);

            // TRANSLATION AXIS
            let translateX = '0rem';
            if (isCapturing) {
              translateX = isCurrent ? '-3rem' : (dist === 1 ? '1.5rem' : '3rem');
            } else {
              // Idle state: shift dashes RIGHT (away from center)
              if (!isSlot) {
                const distFromSlots = rIdx < 2 ? (1.5 - rIdx) : (rIdx - (activeSlots.length + 1.5));
                translateX = `${distFromSlots * 1.5}rem`;
              }
            }

            const isSlotExcessInCompositing = isFinished && isSlot && slotIdx >= selectedFrame.slots;

            return (
              <div
                key={rIdx}
                className={`${vfStyles.wheelItem} ${(isCurrent || isTargeted || isReviewTarget) ? vfStyles.active : ''} ${isSlotExcessInCompositing ? vfStyles.disabled : ''}`}
                style={{
                  transform: `translateX(${translateX}) scale(${scale})`,
                  opacity: isSlotExcessInCompositing ? opacity * 0.25 : opacity,
                  filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
                  cursor: isSlotExcessInCompositing ? 'not-allowed' : (((!isFinished && !isCapturing && isSlot) || (isFinished && isSlot)) ? 'pointer' : 'default'),
                  pointerEvents: isSlotExcessInCompositing ? 'none' : 'auto'
                }}
                onClick={() => {
                  if (isFinished && isSlot) {
                    if (slotIdx < selectedFrame.slots) {
                      setTargetedSlotIndex(slotIdx);
                    }
                  } else if (!isFinished && !isCapturing && isSlot) {
                    toggleSlot(slotIdx);
                  }
                }}
              >
                {!isSlot ? (
                  <div className={vfStyles.wheelDash}></div>
                ) : (
                  <>
                    {!isFinished && !isCapturing && (
                      <div className={`${vfStyles.targetLock} ${activeSlots[slotIdx] ? vfStyles.targeted : ''}`}>
                        {activeSlots[slotIdx] ? (
                          <span className={vfStyles.targetActiveLabel} style={{ whiteSpace: 'nowrap' }}>
                            {photos[slotIdx] ? '[ RE-TAKE ]' : `[ SLOT 0${slotIdx + 1} ]`}
                          </span>
                        ) : (
                          <span className={vfStyles.targetIdleLabel} style={{ whiteSpace: 'nowrap' }}>
                            {photos[slotIdx] ? '[ KEEP ]' : '[ ]'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`${vfStyles.wheelThumb} ${!photos[slotIdx] ? vfStyles.empty : ''} ${(activeSlots[slotIdx] && photos[slotIdx] && !isFinished) ? vfStyles.retakeMarked : ''}`}>
                      {photos[slotIdx] ? (
                        <>
                          <img src={photos[slotIdx]} alt={`Thumb ${slotIdx}`} />
                          {activeSlots[slotIdx] && !isFinished && !isCapturing && (
                            <div className={vfStyles.retakeCrossOverlay}></div>
                          )}
                        </>
                      ) : (
                        <div className={vfStyles.blueprint}>
                          <div className={`${vfStyles.cropMark} ${vfStyles.cmTl}`} />
                          <div className={`${vfStyles.cropMark} ${vfStyles.cmTr}`} />
                          <div className={`${vfStyles.cropMark} ${vfStyles.cmBl}`} />
                          <div className={`${vfStyles.cropMark} ${vfStyles.cmBr}`} />
                          <div className={vfStyles.centerCrosshair} />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* BOTTOM-RIGHT: FRAME INDEX */}
        <div ref={hudBottomRightRef} className={`${vfStyles.hudAnchor} ${vfStyles.bottomRight}`}>
          <div className={vfStyles.indexDisplay}>
            {Math.min((photos.length - 1) + 1, selectedFrame.slots)} / {selectedFrame.slots}
          </div>
          <div className={vfStyles.serialDetail}>
            DEMO V1.3
          </div>
        </div>

        {/* CENTER: TAP ANYWHERE CTA */}
        {!isCapturing && !isFinished && countdown === null && (
          <div className={`${vfStyles.hudAnchor} ${vfStyles.absoluteCenter}`} style={{ opacity: 1 }}>
            <span className="ctaLabel">{t('shutterCta')}</span>

          </div>
        )}

        {/* ELEGANT CENTER COUNTDOWN */}
        {countdown !== null && (
          <div className={`${vfStyles.hudAnchor} ${vfStyles.absoluteCenter}`} style={{ opacity: 1 }}>
            <div ref={countdownTextRef} className={vfStyles.countdownNumber}>{countdown}</div>
          </div>
        )}


      </div>


      {/* FX OVERLAYS */}
      <div className={vfStyles.vignette}></div>
      <div className={vfStyles.scanlines}></div>

      {/* MICRO-REVIEW */}
      {
        // showFreezeFrame && lastCapturedPhoto && (
        //   <div className={vfStyles.freezeFrame}>
        //     <img src={lastCapturedPhoto || "/taken_pic/default.png"} alt="Freeze" className={vfStyles.freezeImg} />
        //     <div className={vfStyles.freezeScanline}></div>
        //   </div>
        // )
      }

      {/* RESULT OVERLAY */}
      {
        isFinished && !isCapturing && photos.some(p => !!p) && (() => {


          const FILTERS = [
            { label: 'RAW', value: 'none' },
            { label: 'MONO', value: 'grayscale(100%) contrast(1.1)' },
            { label: 'NOIR', value: 'grayscale(100%) brightness(0.85) contrast(1.4)' },
            // { label: 'FADE', value: 'brightness(1.15) contrast(0.8) saturate(0.7)' },
            { label: 'COLD', value: 'hue-rotate(200deg) saturate(1.2) brightness(1.05)' },
            { label: 'WARM', value: 'hue-rotate(-20deg) saturate(1.4) brightness(1.05)' },
            { label: 'VIVID', value: 'saturate(2) contrast(1.1)' },
            // { label: 'CYBER', value: 'hue-rotate(180deg) saturate(3) contrast(1.2) brightness(1.1)' },
            { label: 'SEPIA', value: 'sepia(80%) contrast(1.05)' },
          ];

          return (
            <div ref={compositingPanelRef} className={`milky-mica-background ${cpStyles.panel}`}>
              <div className="panel-left">
                {/* Vertical Watermark — separate ref for deepest parallax */}
                <h2 className="watermark-sideways">{t('curateWatermark')}</h2>

                <div style={{ width: '100%', marginTop: '8rem', marginBottom: 'auto', zIndex: 20 }}>
                  {/* Hero Title with Cyan Overlap */}
                  <div className="side-display-container">
                    <div className="side-display-bullet">▌</div>
                    <h2 className="side-display-h1">{t('compositingTitle')}</h2>
                  </div>

                  <div className={cpStyles.instructionsList}>
                    {/* Step 1 */}
                    <div className={cpStyles.instructionStep}>
                      <span className={cpStyles.instructionNum}>01.</span>
                      <div className={cpStyles.instructionContent}>
                        <span className={cpStyles.sectionLabel}>{t('lensProfileLabel')}</span>
                        <div className={cpStyles.filterList} ref={filterListRef}>
                          <div className={cpStyles.magneticAnchor} ref={magneticAnchorRef}>▌</div>
                          {FILTERS.map(f => (
                            <button
                              key={f.label}
                              onClick={() => {
                                if (f.value === selectedFilter) return;
                                setSelectedFilter(f.value);
                              }}
                              className={`${cpStyles.filterBtn} ${selectedFilter === f.value ? cpStyles.active : ''}`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className={cpStyles.instructionStep}>
                      <span className={cpStyles.instructionNum}>02.</span>
                      <div className={cpStyles.instructionContent}>
                        <span className={cpStyles.sectionLabel}>{t('orientationLabel')}</span>
                        <div
                          className={cpStyles.transformToggle}
                          onClick={() => setIsMirrored(!isMirrored)}
                        >
                          <span className={cpStyles.transformLabel}>{t('orientationMirrored')}</span>
                          <div className={`${cpStyles.switch} ${isMirrored ? cpStyles.active : ''}`}>
                            <div className={cpStyles.switchLine}></div>
                            <div className={cpStyles.switchDot}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    {photos.some(p => !!p) && (
                      <div className={cpStyles.instructionStep}>
                        <span className={cpStyles.instructionNum}>03.</span>
                        <div className={cpStyles.instructionContent}>
                          <span className={cpStyles.sectionLabel}>{t('layersLabel')}</span>
                          <p className={cpStyles.instructionText}>
                            {t('layersDesc')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="panel-right panel-center-content">
                {/* <div className={cpStyles.greebles}>RENDER_SIZE: 14.2MB // PRINT_QUEUE: READY // DPI: 300</div> */}
                <div className={cpStyles.statusFooter}>
                  <span>SYS.DEMO_v1.3</span>
                  {/* <RunningTimestamp /> */}
                  {/* <span>BUFFER_LOADED: 100%</span> */}
                </div>
                <div className={cpStyles.floatingContainer}>
                  {selectedFrame.slots > 1 ? (
                    <CollageComposer
                      ref={composerRef}
                      photos={photos}
                      frame={selectedFrame}
                      photoFilter={selectedFilter}
                      isMirrored={isMirrored}
                      isProcessing={isProcessingFilter}
                      onActiveIndexChange={(idx) => setTargetedSlotIndex(idx)}
                    />
                  ) : (
                    <InteractivePhoto
                      ref={composerRef}
                      photos={photos}
                      frame={selectedFrame}
                      photoFilter={selectedFilter}
                      isMirrored={isMirrored}
                      isProcessing={isProcessingFilter}
                      onActiveIndexChange={(idx) => setTargetedSlotIndex(idx)}
                    />
                  )}
                </div>
                <div className="finalize-action-container" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                  <SecondaryButton
                    onClick={() => {
                      if (targetedSlotIndex !== -1) {
                        const newSlots = new Array(selectedFrame.slots).fill(false);
                        newSlots[targetedSlotIndex] = true;
                        setActiveSlots(newSlots);
                        setCurrentSlotIndex(targetedSlotIndex);
                      }
                      setIsFinished(false);
                    }}
                    disabled={targetedSlotIndex === -1}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    [ RETAKE {(targetedSlotIndex !== -1 ? (targetedSlotIndex + 1).toString().padStart(2, '0') : '--')} ]
                  </SecondaryButton>
                  <CtaButton onClick={handleExport}>
                    {t('printComposition')}
                  </CtaButton>
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
