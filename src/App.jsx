import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { animate } from 'animejs';

import FloatingPhotos from './components/shared/Starfield';
import IdleScreen from './components/screens/00-Idle';

import PaymentScreen from './components/screens/01-Payment';
import SelectionScreen from './components/screens/02-Selection';
import CaptureScreen from './components/screens/03-Capture';
import PrintManifestScreen from './components/screens/04-Checkout';
import ExportScreen from './components/screens/05-Export';

import OutroScreen from './components/screens/06-Outro';

import KineticPagination from './components/shared/KineticPagination';
import CommunityGalleryModal from './components/shared/CommunityGalleryModal';
import { useKioskBoot } from './hooks/useKioskBoot';
import { FRAME_TYPES, DEFAULT_FRAME } from './constants/frames';
import { getKioskId, getMachineUUID, syncKioskConfig } from './utils/kioskId';
import { PrimaryButton, CtaButton, SecondaryButton, SquareWaveLoader } from './ui';
import PrintCalibrationSheet from './components/shared/PrintCalibrationSheet';
import exportStyles from './components/screens/05-Export.module.css';





const generateSessionHash = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// --- OTAK STATE MACHINE ---
export default function App() {
  const [sessionHash, setSessionHash] = useState(generateSessionHash());
  const { kioskData, loading: kioskLoading } = useKioskBoot();
  const appRef = React.useRef();
  // 0: Idle, 1: Payment, 2: Selection, 3: Capture, 4: Print Manifest, 5: Export, 6: Outro
  const [currentStep, setCurrentStep] = useState(0);
  const [kioskId] = useState(getKioskId());
  const [machineUUID] = useState(getMachineUUID());
  const [isTunneling, setIsTunneling] = useState(false);
  const [isGlobalTransitioning, setIsGlobalTransitioning] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [outroType, setOutroType] = useState('NORMAL');
  const [finalImage, setFinalImage] = useState(null);
  const [amountPaid, setAmountPaid] = useState(0);
  const [isOutroExiting, setIsOutroExiting] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [isMaintenanceLocked, setIsMaintenanceLocked] = useState(false);
  const [isMaintenanceExiting, setIsMaintenanceExiting] = useState(false);
  const [isDonating, setIsDonating] = useState(true);
  const [allowCloudUpload, setAllowCloudUpload] = useState(true);

  // Advanced Nerd Printer HUD States
  const [isPrinterDevOpen, setIsPrinterDevOpen] = useState(false);
  const [devPrinterName, setDevPrinterName] = useState(localStorage.getItem('PHOTOBOOTH_PRINTER_NAME') || 'Epson SL-D500');
  const [devPrintScale, setDevPrintScale] = useState(localStorage.getItem('PHOTOBOOTH_PRINT_SCALE') || '100');
  const [devPrintRotation, setDevPrintRotation] = useState(localStorage.getItem('PHOTOBOOTH_PRINT_ROTATION') || '0');

  const [idleBrandText, setIdleBrandText] = useState('HYPE-BOX');
  const [idleBrandTextScale, setIdleBrandTextScale] = useState('100');
  const [isBrandingDevOpen, setIsBrandingDevOpen] = useState(false);

  // Telemetry HUD Animation Logic
  // Telemetry HUD Animation Logic (Visible from Selection to Checkout, hidden in Export/Outro)
  const isTelemetryVisible = currentStep >= 2 && currentStep <= 4 && !isMaintenanceLocked;

  // Global Asset Preloading
  useEffect(() => {
    const frameAssets = [...FRAME_TYPES.map(f => f.thumbnail), DEFAULT_FRAME.thumbnail];
    const uiAssets = ['/hero.png', '/icons.svg', '/favicon.svg'];
    const starfieldAssets = Array.from({ length: 30 }, (_, i) => `/starfield/${i + 1}.webp`);

    const assetsToPreload = [...frameAssets, ...uiAssets, ...starfieldAssets];

    assetsToPreload.forEach(src => {
      if (!src) return;
      const img = new Image();
      img.src = src;
    });

    console.log(`[Preloader] ${assetsToPreload.length} assets queued for caching.`);
  }, []);

  useEffect(() => {
    const el = document.querySelector('.telemetry-anchor-top-right');
    if (!el) return;

    if (isTelemetryVisible) {
      animate(el, {
        translateX: [100, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
        onBegin: () => {
          el.style.pointerEvents = 'auto';
        }
      });
    } else {
      animate(el, {
        translateX: 100,
        opacity: 0,
        duration: 600,
        easing: 'easeInCubic',
        onComplete: () => {
          el.style.pointerEvents = 'none';
        }
      });
    }
  }, [isTelemetryVisible]);
  const [printCopies, setPrintCopies] = useState(1);
  const [initialCopies, setInitialCopies] = useState(1);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCaptureFinished, setIsCaptureFinished] = useState(false);
  const [captureFilter, setCaptureFilter] = useState('none');
  const [captureMirrored, setCaptureMirrored] = useState(true);
  const [captureSlotIndex, setCaptureSlotIndex] = useState(0);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [isCameraRequested, setIsCameraRequested] = useState(false);

  const activeFrame = selectedFrame || DEFAULT_FRAME;


  // Timer Sesi (5 menit = 300 detik) - Steps 2 & 3
  const [sessionTime, setSessionTime] = useState(300);
  // Timer Transaksi (3 menit = 180 detik) - Steps 1, 4, 5
  // Timer Transaksi (3 menit = 180 detik) - Steps 1, 4, 5
  const [transactionTime, setTransactionTime] = useState(180);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState('PAYMENT'); // 'PAYMENT', 'CONFIRM', 'TIMEOUT'

  useEffect(() => {
    let timer;
    let exportTimeout;

    if (currentStep >= 2 && currentStep <= 3) {
      if (sessionTime <= 0) {
        if (capturedPhotos.some(p => !!p)) {
          // Force to checkout instead of timeout by triggering export
          if (currentStep === 3 && !isTimerPaused) {
            setIsTimerPaused(true);
            if (!isCaptureFinished) {
              setIsCaptureFinished(true);
              setTransactionTime(180); // Reset for checkout
              setIsTimerPaused(false);
              exportTimeout = setTimeout(() => captureRef.current?.export(), 500);
            } else {
              setTransactionTime(180); // Reset for checkout
              setIsTimerPaused(false);
              captureRef.current?.export();
            }
          } else if (currentStep === 2) {
            // If in selection (step 2), we don't have an export yet
            setOutroType('TIMEOUT');
            setCurrentStep(6);
            setFinalImage(null);
          }
        } else {
          setOutroType('TIMEOUT');
          setCurrentStep(6);
          setFinalImage(null);
        }
        return;
      }
      timer = setInterval(() => {
        if (!isTimerPaused) setSessionTime(prev => prev - 1);
      }, 1000);
    } else if (currentStep === 1 || currentStep === 4) {
      if (transactionTime <= 0) {
        if (currentStep === 1) {
          paymentRef.current?.exit();
          // We don't return here yet to allow the onBack of exit() to handle state change, 
          // but we reset time to 1 so it doesn't loop until onBack fires.
          setTransactionTime(1);
          return;
        }

        // Step 4 Timeout: Trigger 10s confirmation instead of immediate end
        // Step 4 Timeout: Trigger 10s confirmation instead of immediate end
        if (currentStep === 4) {
          if (checkoutMode !== 'TIMEOUT' || !isCheckoutModalOpen) {
            setCheckoutMode('TIMEOUT');
            setIsCheckoutModalOpen(true);
            setIsTimerPaused(true);
            // Set time to 1 to prevent immediate re-trigger loop if modal closes
            setTransactionTime(1);
            return;
          }
          return;
        }

        setOutroType('TIMEOUT');
        setCurrentStep(6);
        setFinalImage(null);
        return;
      }
      timer = setInterval(() => {
        if (!isTimerPaused) setTransactionTime(prev => prev - 1);
      }, 1000);
    }

    if (currentStep === 0 || currentStep === 6) {
      setSessionTime(300);
      setTransactionTime(180);
      setIsTimerPaused(false);
      setCheckoutMode('PAYMENT');
    }

    return () => {
      clearInterval(timer);
      if (exportTimeout) clearTimeout(exportTimeout);
    };
  }, [currentStep, sessionTime, transactionTime, isTimerPaused, isCaptureFinished, capturedPhotos, isCheckoutModalOpen, checkoutMode]);

  const [devMode, setDevMode] = useState(false);
  const [devFreeFlow, setDevFreeFlow] = useState(false);
  const [bypassMode, setBypassMode] = useState(() => {
    return localStorage.getItem('PHOTOBOOTH_BYPASS_MODE') === 'true';
  });
  const [language, setLanguage] = useState('EN');

  useEffect(() => {
    syncKioskConfig();
    const handleKeydown = (e) => {
      if (e.key === '`') {
        setDevMode(prev => {
          const next = !prev;
          if (next) {
            setSessionTime(300);
            setTransactionTime(180);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeydown);

    window.simulateMaintenanceLock = () => {
      setIsMaintenanceLocked(true);
      setIsMaintenanceExiting(false);
    };
    window.simulateMaintenanceUnlock = () => {
      setIsMaintenanceExiting(true);
    };

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      delete window.simulateMaintenanceLock;
      delete window.simulateMaintenanceUnlock;
    };
  }, []);

  const handleAbort = useCallback(() => {
    setOutroType('TIMEOUT');
    setFinalImage(null);
    setCurrentStep(6);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsTunneling(false);
    setSelectedFrame(null);
    setOutroType('NORMAL');
    setFinalImage(null);
    setAmountPaid(0);
    setPrintCopies(1);
    setIsDonating(true);
    setCapturedPhotos([]);
    setIsCaptureFinished(false);
    setCaptureFilter('none');
    setCaptureMirrored(true);
    setCaptureSlotIndex(0);
    setSessionTime(300);
    setTransactionTime(180);
    setIsCheckoutModalOpen(false);
    setIsOutroExiting(false);
    setSessionHash(generateSessionHash());
    localStorage.removeItem('photobooth_session');
    setLanguage('EN');
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const sessionTotal = 300;
  const transactionTotal = 180;
  const progress = currentStep <= 3 ? (sessionTime / sessionTotal) : (transactionTime / transactionTotal);

  const [captureSubState, setCaptureSubState] = useState('viewfinder'); // 'viewfinder' | 'compositing'
  const captureRef = React.useRef();
  const paymentRef = React.useRef();

  // --- SESSION RECOVERY LOGIC ---
  useEffect(() => {
    // We only save if we are past the Idle screen (currentStep > 0)
    // and not yet in the Outro screen (currentStep < 6)
    if (currentStep > 0 && currentStep < 6) {
      const sessionData = {
        currentStep,
        selectedFrame,
        amountPaid,
        capturedPhotos,
        printCopies,
        captureFilter,
        captureMirrored,
        finalImage,
        isDonating,
        sessionTime,
        transactionTime,
        sessionHash,
        timestamp: Date.now()
      };
      localStorage.setItem('photobooth_session', JSON.stringify(sessionData));
    }
  }, [currentStep, selectedFrame, amountPaid, capturedPhotos, printCopies, captureFilter, captureMirrored, finalImage, sessionTime, transactionTime, sessionHash]);

  const handleRestoreSession = useCallback((data) => {
    // Restore all states
    setAmountPaid(data.amountPaid || 0);
    setPrintCopies(data.printCopies || 1);
    setSelectedFrame(data.selectedFrame || null);
    setCapturedPhotos(data.capturedPhotos || []);
    setCaptureFilter(data.captureFilter || 'none');
    setCaptureMirrored(data.captureMirrored !== undefined ? data.captureMirrored : true);
    setFinalImage(data.finalImage || null);
    if (data.isDonating !== undefined) setIsDonating(data.isDonating);
    if (data.sessionTime !== undefined) setSessionTime(data.sessionTime);
    if (data.transactionTime !== undefined) setTransactionTime(data.transactionTime);
    if (data.sessionHash) setSessionHash(data.sessionHash);
    setIsCheckoutModalOpen(false);

    // Analyze Progress to Set Destination
    const hasRealPhotos = data.capturedPhotos && data.capturedPhotos.some(p => p && !p.includes('default.png'));
    const hasFrame = !!data.selectedFrame;
    const hasPaid = (data.amountPaid || 0) > 0;

    if (hasRealPhotos || data.finalImage) {
      // Case A: Photos taken -> Compositing
      setCurrentStep(3);
      setIsCaptureFinished(true);
    } else if (hasFrame) {
      // Case B: Frame Selected, no photos -> Viewfinder
      setCurrentStep(3);
      setIsCaptureFinished(false);
    } else if (hasPaid) {
      // Case C: Paid, no frame -> Selection
      setCurrentStep(2);
    } else {
      // Fallback
      setCurrentStep(1);
    }
  }, []);

  // CAMERA MANAGEMENT (LAZY INITIALIZATION)
  useEffect(() => {
    // Narrowed: only requested warmup or active in Capture (Step 3)
    const isCameraNeeded = currentStep === 3 || isCameraRequested;

    if (!isCameraNeeded) {
      if (cameraStream) {
        console.log("[App] Stopping camera stream - out of range");
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      return;
    }

    const startCamera = async () => {
      try {
        // Ensure devices are enumerated if we're in range
        if (cameraDevices.length === 0) {
          console.log("[App] Lazy enumerating devices...");
          const initial = await navigator.mediaDevices.getUserMedia({ video: true });
          initial.getTracks().forEach(t => t.stop());
          const allDevices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
          setCameraDevices(videoDevices);

          if (videoDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevices[0].deviceId);
            return; // Effect will re-run with selectedDeviceId
          }
        }

        if (!selectedDeviceId) return;

        // Check if current stream is already correct and active
        const activeTrack = cameraStream?.getVideoTracks()[0];
        const currentId = activeTrack?.getSettings()?.deviceId;

        if (cameraStream && cameraStream.active && currentId === selectedDeviceId) {
          return; // Already streaming correct device
        }

        // Cleanup old stream if switching or restarting
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
        }

        console.log("[App] Starting camera stream for device:", selectedDeviceId);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        setCameraStream(stream);
      } catch (err) {
        console.error("Camera management error:", err);
      }
    };

    startCamera();
  }, [currentStep, selectedDeviceId, isCameraRequested, cameraDevices, cameraStream]);


  const transitionTimeout1 = React.useRef(null);
  const transitionTimeout2 = React.useRef(null);
  const ensureTimeout = React.useRef(null);

  const onEnsureCamera = useCallback(() => {
    // Force re-start stream if it died
    setSelectedDeviceId(prev => {
      return ""; // trigger effect
    });
    if (ensureTimeout.current) clearTimeout(ensureTimeout.current);
    ensureTimeout.current = setTimeout(() => setSelectedDeviceId(selectedDeviceId), 50);
  }, [selectedDeviceId]);

  useEffect(() => {
    return () => {
      if (ensureTimeout.current) clearTimeout(ensureTimeout.current);
    };
  }, []);

  // GLOBAL TRANSITION HANDLER
  const startPageTransition = (callback) => {
    setIsGlobalTransitioning(true);
    // Short delay to allow the white overlay to cover the screen
    if (transitionTimeout1.current) clearTimeout(transitionTimeout1.current);
    transitionTimeout1.current = setTimeout(() => {
      callback();
      // Keep it white for a moment for the new screen to mount
      if (transitionTimeout2.current) clearTimeout(transitionTimeout2.current);
      transitionTimeout2.current = setTimeout(() => {
        setIsGlobalTransitioning(false);
      }, 100);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (transitionTimeout1.current) clearTimeout(transitionTimeout1.current);
      if (transitionTimeout2.current) clearTimeout(transitionTimeout2.current);
    };
  }, []);

  return (
    <div ref={appRef} className="app-wrapper" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <CommunityGalleryModal isOpen={showGallery} onClose={() => setShowGallery(false)} />

      <FloatingPhotos
        previousImage={outroType === 'NORMAL' ? finalImage : null}
        isOutro={currentStep >= 3 || isMaintenanceLocked || isMaintenanceExiting}
        isVisible={currentStep < 2 || currentStep >= 5 || isMaintenanceLocked || isMaintenanceExiting}
        showPhotos={currentStep < 2 || currentStep >= 5 || isMaintenanceLocked || isMaintenanceExiting}
        isTransformed={(isTunneling || currentStep === 1 || (currentStep >= 3 && !isOutroExiting) || isMaintenanceLocked) && !isMaintenanceExiting}
        grayscale={isMaintenanceLocked && !isMaintenanceExiting}
      />

      {/* GLOBAL KINETIC PAGINATION */}
      <KineticPagination
        currentStep={currentStep}
        subState={captureSubState}
        isVisible={currentStep > 0 && currentStep < 6 && !isMaintenanceLocked}
        backLabel={
          currentStep === 1 ? (isCheckoutModalOpen ? null : 'Cancel Session') :
            currentStep === 3 ? (captureSubState === 'compositing' ? 'Retake Photos' : 'Change Frame') :
              currentStep === 4 ? ((isCheckoutModalOpen || sessionTime <= 0) ? null : 'Back to Editing') : null
        }
        onBack={((currentStep === 1 && !isCheckoutModalOpen) || currentStep === 3 || (currentStep === 4 && !isCheckoutModalOpen && sessionTime > 0)) ? () => {
          if (currentStep === 1) {
            paymentRef.current?.exit();
          }
          if (currentStep === 3) {
            if (captureSubState === 'compositing') {
              setIsCaptureFinished(false);
            } else {
              setCurrentStep(2);
            }
          }
          if (currentStep === 4) setCurrentStep(3); // Go back to compositing
        } : null}
        isCheckoutModalOpen={isCheckoutModalOpen}
      />

      {/* ARCHITECTURAL LIFELINE */}
      {(currentStep >= 2 && currentStep <= 4) && (
        <div className="architectural-lifeline" style={{ width: `${progress * 100}vw` }}></div>
      )}

      {/* GLOBAL HUD TIMER (TYPOGRAPHIC ANCHOR) */}
      <div className="telemetry-anchor-top-right">
        <div className="telemetry-label-micro">
          {currentStep <= 3 ? 'Session' : 'Time Remaining'}
        </div>

        <div className="telemetry-main-row">
          <div className="telemetry-pulse-container">
            <div className="telemetry-pulse-dot"></div>
            {/* <span className="telemetry-pulse-label">Live</span> */}
          </div>
          <div className="telemetry-massive-time">
            {currentStep <= 3 ? formatTime(sessionTime) : formatTime(transactionTime)}
          </div>
        </div>
      </div>

      {/* DEV MODE GLOBAL INDICATOR */}
      {devMode && (
        <div className="dev-mode-indicator-group" style={{ pointerEvents: 'none', zIndex: 2147483647, position: 'fixed', top: '2rem', left: '2rem', alignItems: 'flex-start', textAlign: 'left' }}>
          <div className="dev-mode-indicator">Diagnostics Mode — {kioskData?.vendor_name || 'MASTER'}</div>

          {/* NERD CONFIGURATION CONTROLS */}
          <div className="dev-mode-indicator" style={{ marginTop: '0.5rem', backgroundColor: '#111', border: '1px solid #222', pointerEvents: 'auto' }}>
            <div 
              style={{ color: '#00FFFF', cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: 'monospace' }} 
              onClick={() => setIsPrinterDevOpen(!isPrinterDevOpen)}
            >
              <span>{isPrinterDevOpen ? '▼' : '▶'} PRINTER_NERD_SETTINGS (EPSON)</span>
              <span>[ 4"x6" ]</span>
            </div>
            {isPrinterDevOpen && (
              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.65rem', borderTop: '1px dashed #333', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#777' }}>SPOOLER QUEUE:</span>
                  <input 
                    type="text" 
                    value={devPrinterName}
                    onChange={(e) => {
                      setDevPrinterName(e.target.value);
                      localStorage.setItem('PHOTOBOOTH_PRINTER_NAME', e.target.value);
                    }}
                    style={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '0.6rem', fontFamily: 'monospace', padding: '2px 4px', width: '130px', textAlign: 'right' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#777' }}>SCALE FACTOR:</span>
                  <input 
                    type="number" 
                    value={devPrintScale}
                    onChange={(e) => {
                      setDevPrintScale(e.target.value);
                      localStorage.setItem('PHOTOBOOTH_PRINT_SCALE', e.target.value);
                    }}
                    style={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '0.6rem', fontFamily: 'monospace', padding: '2px 4px', width: '60px', textAlign: 'right' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                  <button 
                    className="telemetry-dev-skip-minimal" 
                    onClick={() => {
                      console.log("[Printer] Spooling manual calibration card print test...");
                      // Force portrait page style for the calibration card
                      const styleId = 'dynamic-print-page-style';
                      let styleEl = document.getElementById(styleId);
                      if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = styleId;
                        document.head.appendChild(styleEl);
                      }
                      styleEl.innerHTML = `
                        @media print {
                          @page {
                            size: 4in 6in !important;
                            margin: 0 !important;
                          }
                        }
                      `;
                      
                      window.print();
                      
                      // Clean up after the print dialog is spooled
                      setTimeout(() => {
                        const el = document.getElementById(styleId);
                        if (el) el.remove();
                      }, 1000);
                    }} 
                    style={{ color: '#00FF00', borderColor: '#00FF00', fontSize: '0.55rem', padding: '2px 6px', backgroundColor: 'rgba(0,255,0,0.05)' }}
                  >
                    RUN TEST PRINT
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* IDLE BRANDING CONTROLS */}
          <div className="dev-mode-indicator" style={{ marginTop: '0.5rem', backgroundColor: '#111', border: '1px solid #222', pointerEvents: 'auto' }}>
            <div
              style={{ color: '#00FFFF', cursor: 'pointer', fontWeight: 900, display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: 'monospace' }}
              onClick={() => setIsBrandingDevOpen(!isBrandingDevOpen)}
            >
              <span>{isBrandingDevOpen ? '▼' : '▶'} IDLE_BRANDING_SETTINGS</span>
            </div>
            {isBrandingDevOpen && (
              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.65rem', borderTop: '1px dashed #333', paddingTop: '0.5rem' }}>

                {/* Brand Text */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#777' }}>BRAND TEXT:</span>
                  <input
                    type="text"
                    value={idleBrandText}
                    onChange={(e) => setIdleBrandText(e.target.value)}
                    style={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '0.6rem', fontFamily: 'monospace', padding: '2px 4px', width: '130px', textAlign: 'right' }}
                  />
                </div>

                {/* Text Scale Slider */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#777' }}>TEXT SCALE: {idleBrandTextScale}%</span>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={idleBrandTextScale}
                    onChange={(e) => setIdleBrandTextScale(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>

              </div>
            )}
          </div>
          <div className="dev-mode-controls" style={{ pointerEvents: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {!isMaintenanceLocked && (
              <>
                <button className="telemetry-dev-skip-minimal" onClick={() => {
                  setSessionTime(300);
                  setTransactionTime(180);
                  setCurrentStep(prev => Math.max(0, prev - 1));
                }}>PREV</button>
                <button className="telemetry-dev-skip-minimal" onClick={() => {
                  setSessionTime(300);
                  setTransactionTime(180);
                  setCurrentStep(prev => prev + 1);
                }}>SKIP</button>
                <button className="telemetry-dev-skip-minimal" onClick={() => { setSessionTime(1); setTransactionTime(1); }} style={{ color: '#FF4444', borderColor: '#FF4444' }}>FORCE_TIMEOUT</button>
                {isCheckoutModalOpen && (
                  <button
                    className="telemetry-dev-skip-minimal"
                    onClick={() => window.simulatePaymentSuccess?.()}
                    style={{ color: '#00FFFF', borderColor: '#00FFFF' }}
                  >
                    AUTHORIZE
                  </button>
                )}
                <button className="telemetry-dev-skip-minimal" onClick={() => setShowGallery(true)} style={{ color: '#00FFFF', borderColor: '#00FFFF' }}>GALLERY</button>
                <button className="telemetry-dev-skip-minimal exit" onClick={handleAbort}>END</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* DEV MODE 3 BUTTONS & QR BOX PREVIEW (BOTTOM-RIGHT) */}
      {devMode && (
        <>
          {/* QR LOADING BOX PREVIEW */}
          <div style={{ position: 'fixed', bottom: '2rem', right: '19rem', zIndex: 10001, pointerEvents: 'auto' }}>
            <div className="qr-box" style={{ width: '160px', height: '160px', margin: 0, position: 'relative', background: '#FFFFFF', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div className="vf-corner tl"></div>
              <div className="vf-corner tr"></div>
              <div className="vf-corner bl"></div>
              <div className="vf-corner br"></div>
              <div className={exportStyles.qrContainer}>
                <SquareWaveLoader color="#111111" size={12} gap={8} />
              </div>
            </div>
          </div>

          {/* PRIMARY & CTA BUTTONS */}
          <div style={{ position: 'fixed', bottom: '6.5rem', right: '2rem', zIndex: 10001, display: 'flex', flexDirection: 'column', gap: '0.8rem', pointerEvents: 'auto' }}>
            <PrimaryButton>
              PRIMARY
            </PrimaryButton>
            <CtaButton>
              CTA
            </CtaButton>
          </div>

          {/* SECONDARY BUTTON WITH DIRECT DIFFERENCE BLEND */}
          <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10001, pointerEvents: 'auto', mixBlendMode: 'difference', color: '#FFFFFF' }}>
            <SecondaryButton>
              SECONDARY
            </SecondaryButton>
          </div>
        </>
      )}

      {(isMaintenanceLocked || isMaintenanceExiting) ? (
        <OutroScreen 
          type="MAINTENANCE" 
          onReset={() => {
            setIsMaintenanceLocked(false);
            setIsMaintenanceExiting(false);
          }}
          language={language}
          triggerExit={isMaintenanceExiting}
        />
      ) : (
        <>
          {currentStep === 0 && (
            <IdleScreen
              onNext={() => {
                setFinalImage(null);
                setCurrentStep(1);
                setIsTunneling(false);
              }}
              onTransitionStart={() => setIsTunneling(true)}
              brandText={idleBrandText}
              brandTextScale={idleBrandTextScale}
            />
          )}

          {currentStep === 1 && (
            <PaymentScreen
              ref={paymentRef}
              onBack={handleReset}
              onSuccess={(paid) => {
                setIsCheckoutModalOpen(false);
                setAmountPaid(paid);
                setInitialCopies(printCopies);
                startPageTransition(() => setCurrentStep(2));
              }}
              printCopies={printCopies}
              setPrintCopies={setPrintCopies}
              timerDisplay={formatTime(transactionTime)}
              transactionTime={transactionTime}
              devMode={devMode}
              setIsTimerPaused={setIsTimerPaused}
              kioskId={kioskId}
              devFreeFlow={devFreeFlow}
              onRestoreSession={handleRestoreSession}
              selectedFrame={selectedFrame}
              bypassMode={bypassMode}
              language={language}
              setLanguage={setLanguage}
              isCheckoutOpen={isCheckoutModalOpen}
              setIsCheckoutOpen={setIsCheckoutModalOpen}
            />
          )}

          {currentStep === 2 && (
            <SelectionScreen
              devMode={devMode}
              kioskData={kioskData || { frames: [] }}
              loading={kioskLoading}
              onPrepareCamera={() => setIsCameraRequested(true)}
              onFinish={(frame) => startPageTransition(() => {
                setSelectedFrame(frame);
                setCurrentStep(3);
                setCaptureSubState('viewfinder');
                setIsCameraRequested(false);
              })}
              language={language}
            />
          )}

          {currentStep === 3 && (
            <CaptureScreen
              ref={captureRef}
              selectedFrame={selectedFrame}
              photos={capturedPhotos}
              setPhotos={setCapturedPhotos}
              isFinished={isCaptureFinished}
              setIsFinished={setIsCaptureFinished}
              selectedFilter={captureFilter}
              setSelectedFilter={setCaptureFilter}
              isMirrored={captureMirrored}
              setIsMirrored={setCaptureMirrored}
              currentSlotIndex={captureSlotIndex}
              setCurrentSlotIndex={setCaptureSlotIndex}
              onBack={() => {
                // Disable back if timeout happened (sessionTime <= 0)
                if (sessionTime <= 0) return;

                if (isCaptureFinished) {
                  setIsCaptureFinished(false);
                } else {
                  setCurrentStep(2);
                }
              }}
              onFinish={(img) => {
                setFinalImage(img);
                setOutroType('NORMAL');
                setIsCheckoutModalOpen(false);
                setCurrentStep(4);
              }}
              setCaptureSubState={setCaptureSubState}
              kioskId={kioskId}
              devMode={devMode}
              cameraStream={cameraStream}
              cameraDevices={cameraDevices}
              selectedDeviceId={selectedDeviceId}
              setSelectedDeviceId={setSelectedDeviceId}
              onEnsureCamera={onEnsureCamera}
              language={language}
            />
          )}

          {currentStep === 4 && (
            <PrintManifestScreen
              finalImage={finalImage}
              printCopies={printCopies}
              setPrintCopies={setPrintCopies}
              initialCopies={initialCopies}
              isCheckoutOpen={isCheckoutModalOpen}
              setIsCheckoutOpen={setIsCheckoutModalOpen}
              transactionTime={transactionTime}
              amountPaid={amountPaid}
              onNext={(agreed) => {
                setAllowCloudUpload(agreed !== false);
                setCurrentStep(5);
              }}
              devFreeFlow={devFreeFlow}
              setIsTimerPaused={setIsTimerPaused}
              checkoutMode={checkoutMode}
              setCheckoutMode={setCheckoutMode}
              onTimeout={handleAbort}
              sessionHash={sessionHash}
              bypassMode={bypassMode}
              language={language}
            />
          )}

          {currentStep === 5 && (
            <ExportScreen
              finalImage={finalImage}
              capturedPhotos={capturedPhotos}
              printCopies={printCopies}
              onFinish={(donating) => {
                setIsDonating(donating);
                setCurrentStep(6);
              }}
              kioskId={kioskId}
              devFreeFlow={devFreeFlow}
              sessionHash={sessionHash}
              selectedFrame={selectedFrame}
              language={language}
              allowCloudUpload={allowCloudUpload}
            />
          )}

          {currentStep === 6 && (
            <OutroScreen 
              finalImage={finalImage} 
              type={outroType} 
              isDonating={isDonating}
              onReset={handleReset} 
              onExitStart={() => setIsOutroExiting(true)} 
              language={language}
            />
          )}
        </>
      )}

      {/* Calibration sheet — always active, sole print target for every window.print() */}
      {createPortal(
        <PrintCalibrationSheet
          printerName={devPrinterName}
          scale={devPrintScale}
          rotation={devPrintRotation}
          machineUUID={machineUUID}
          style={{ transform: `scale(${Number(devPrintScale) / 100}) rotate(${Number(devPrintRotation)}deg)`, transformOrigin: 'center' }}
        />,
        document.body
      )}

    </div>
  );
};

