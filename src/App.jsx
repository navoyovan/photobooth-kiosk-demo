import React, { useState, useEffect, useCallback } from 'react';
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
import KioskIdentitySetup from './components/shared/KioskIdentitySetup';
import { DEFAULT_FRAME } from './constants/frames';
import { getKioskId, getMachineUUID, syncKioskConfig } from './utils/kioskId';

// --- OTAK STATE MACHINE ---
export default function App() {
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
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  // Telemetry HUD Animation Logic
  const isTelemetryVisible = currentStep >= 2 && currentStep <= 5;

  useEffect(() => {
    if (isTelemetryVisible) {
      animate('.telemetry-anchor-top-right', {
        translateX: [100, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic',
        onBegin: () => {
          const el = document.querySelector('.telemetry-anchor-top-right');
          if (el) el.style.pointerEvents = 'auto';
        }
      });
    } else {
      animate('.telemetry-anchor-top-right', {
        translateX: 100,
        opacity: 0,
        duration: 600,
        easing: 'easeInCubic',
        onComplete: () => {
          const el = document.querySelector('.telemetry-anchor-top-right');
          if (el) el.style.pointerEvents = 'none';
        }
      });
    }
  }, [isTelemetryVisible]);
  const [printCopies, setPrintCopies] = useState(1);
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
  const [transactionTime, setTransactionTime] = useState(180);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  useEffect(() => {
    let timer;
    if (currentStep >= 2 && currentStep <= 3) {
      if (sessionTime <= 0) {
        setOutroType('TIMEOUT');
        setCurrentStep(6);
        setFinalImage(null);
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
    }

    return () => clearInterval(timer);
  }, [currentStep, sessionTime, transactionTime, isTimerPaused]);

  const [devMode, setDevMode] = useState(false);
  const [devFreeFlow, setDevFreeFlow] = useState(false);

  useEffect(() => {
    syncKioskConfig();
    const handleKeydown = (e) => {
      if (e.key.toLowerCase() === 'p') {
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
    return () => window.removeEventListener('keydown', handleKeydown);
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
    setCapturedPhotos([]);
    setIsCaptureFinished(false);
    setCaptureFilter('none');
    setCaptureMirrored(true);
    setCaptureSlotIndex(0);
    setSessionTime(300);
    setTransactionTime(180);
    setIsCheckoutModalOpen(false);
    setIsOutroExiting(false);
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

  // GLOBAL TRANSITION HANDLER
  const startPageTransition = (callback) => {
    setIsGlobalTransitioning(true);
    // Short delay to allow the white overlay to cover the screen
    setTimeout(() => {
      callback();
      // Keep it white for a moment for the new screen to mount
      setTimeout(() => {
        setIsGlobalTransitioning(false);
      }, 100);
    }, 300);
  };

  return (
    <div ref={appRef} className="app-wrapper" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <KioskIdentitySetup forceShow={isSetupOpen} onClose={() => setIsSetupOpen(false)} />

      <FloatingPhotos
        previousImage={outroType === 'NORMAL' ? finalImage : null}
        isOutro={currentStep >= 3}
        isVisible={currentStep !== 2}
        showPhotos={currentStep < 2 || currentStep >= 5}
        isTransformed={isTunneling || currentStep === 1 || (currentStep >= 3 && !isOutroExiting)}
      />

      {/* GLOBAL KINETIC PAGINATION */}
      <KineticPagination
        currentStep={currentStep}
        subState={captureSubState}
        isVisible={currentStep > 0 && currentStep < 6}
        backLabel={
          currentStep === 1 ? '← CANCEL SESSION' :
            currentStep === 3 ? (captureSubState === 'compositing' ? '← RETAKE SESSION' : '← CHANGE LAYOUT') :
              currentStep === 4 ? (isCheckoutModalOpen ? null : '← BACK TO COMPOSITING') : null
        }
        onBack={(currentStep === 1 || currentStep === 3 || (currentStep === 4 && !isCheckoutModalOpen)) ? () => {
          if (currentStep === 1) {
            paymentRef.current?.exit();
          }
          if (currentStep === 3) {
            if (captureSubState === 'compositing') {
              captureRef.current?.retake();
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
          {currentStep <= 3 ? 'SESSION TIME' : 'TIME LIMIT'}
        </div>

        <div className="telemetry-main-row">
          <div className="telemetry-pulse-dot"></div>
          <div className="telemetry-massive-time">
            {currentStep <= 3 ? formatTime(sessionTime) : formatTime(transactionTime)}
          </div>
        </div>
      </div>

      {/* DEV MODE GLOBAL INDICATOR */}
      {devMode && (
        <div className="dev-mode-indicator-group">
          <div className="dev-mode-indicator">DEV_MODE_ACTIVE</div>
          <div className="dev-mode-indicator" style={{ color: '#FFD700' }}>KIOSK-ID: {kioskId}</div>
          <div className="dev-mode-indicator" style={{ color: '#00FFFF', fontSize: '0.6rem', opacity: 0.7 }}>UUID: {machineUUID}</div>
          <div className="dev-mode-controls">
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
            {isCheckoutModalOpen && (
              <button
                className="telemetry-dev-skip-minimal"
                onClick={() => window.simulatePaymentSuccess?.()}
                style={{ color: '#00FFFF', borderColor: '#00FFFF' }}
              >
                AUTHORIZE
              </button>
            )}
            <button
              className={`telemetry-dev-skip-minimal ${devFreeFlow ? 'active' : ''}`}
              onClick={() => setDevFreeFlow(!devFreeFlow)}
              style={{ color: devFreeFlow ? '#00FF00' : '#FF0000', borderColor: devFreeFlow ? '#00FF00' : '#FF0000' }}
            >
              FREE_FLOW: {devFreeFlow ? 'ON' : 'OFF'}
            </button>
            <button className="telemetry-dev-skip-minimal" onClick={() => setIsSetupOpen(true)}>SETUP</button>
            <button className="telemetry-dev-skip-minimal exit" onClick={handleAbort}>END</button>
          </div>
        </div>
      )}

      {currentStep === 0 && (
        <IdleScreen
          onNext={() => {
            setFinalImage(null);
            setCurrentStep(1);
            setIsTunneling(false);
          }}
          onTransitionStart={() => setIsTunneling(true)}
        />
      )}

      {currentStep === 1 && (
        <PaymentScreen
          ref={paymentRef}
          onBack={() => setCurrentStep(0)}
          onSuccess={(paid) => {
            setAmountPaid(paid);
            startPageTransition(() => setCurrentStep(2));
          }}
          printCopies={1}
          setPrintCopies={() => { }}
          timerDisplay={formatTime(transactionTime)}
          devMode={devMode}
          setIsTimerPaused={setIsTimerPaused}
          kioskId={kioskId}
          devFreeFlow={devFreeFlow}
        />
      )}

      {currentStep === 2 && (
        <SelectionScreen
          devMode={devMode}
          onPrepareCamera={() => setIsCameraRequested(true)}
          onFinish={(frame) => startPageTransition(() => {
            setSelectedFrame(frame);
            setCurrentStep(3);
            setCaptureSubState('viewfinder');
            setIsCameraRequested(false);
          })}
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
          onBack={() => setCurrentStep(2)}
          onFinish={(img) => startPageTransition(() => {
            setFinalImage(img);
            setOutroType('NORMAL');
            setCurrentStep(4);
          })}
          setCaptureSubState={setCaptureSubState}
          kioskId={kioskId}
          devMode={devMode}
          cameraStream={cameraStream}
          cameraDevices={cameraDevices}
          selectedDeviceId={selectedDeviceId}
          setSelectedDeviceId={setSelectedDeviceId}
          onEnsureCamera={() => {
            // Force re-start stream if it died
            setSelectedDeviceId(prev => {
              const current = prev;
              return ""; // trigger effect
            });
            setTimeout(() => setSelectedDeviceId(selectedDeviceId), 50);
          }}
        />
      )}

      {currentStep === 4 && (
        <PrintManifestScreen
          finalImage={finalImage}
          printCopies={printCopies}
          setPrintCopies={setPrintCopies}
          isCheckoutOpen={isCheckoutModalOpen}
          setIsCheckoutOpen={setIsCheckoutModalOpen}
          transactionTime={transactionTime}
          amountPaid={amountPaid}
          onNext={() => setCurrentStep(5)}
          devFreeFlow={devFreeFlow}
        />
      )}

      {currentStep === 5 && (
        <ExportScreen
          finalImage={finalImage}
          printCopies={printCopies}
          onFinish={() => setCurrentStep(6)}
          kioskId={kioskId}
          devFreeFlow={devFreeFlow}
        />
      )}

      {currentStep === 6 && (
        <OutroScreen finalImage={finalImage} type={outroType} onReset={handleReset} onExitStart={() => setIsOutroExiting(true)} />
      )}

      {/* GLOBAL TRANSITION OVERLAY
      <div
        className="global-transition-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#ffffff',
          zIndex: 99999,
          pointerEvents: 'none',
          opacity: isGlobalTransitioning ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          display: isGlobalTransitioning ? 'block' : 'none'
        }}
      /> */}

    </div>
  );
};

// known issues
//pict with filters does not exported correctly
//add more filters like halftone etc
// remove filters>colorize from ExportScreen replace with printing "rolling Curtain" Animation
// add sound effects for each button click?
// remove dev mode, and x button
