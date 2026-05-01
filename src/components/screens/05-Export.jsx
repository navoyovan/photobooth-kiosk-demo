import React, { useRef, useState, useEffect } from 'react';
import { animate, createTimeline } from 'animejs';

const ExportScreen = ({ finalImage, printCopies, onFinish, kioskId, devFreeFlow }) => {
  const screenRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // 1. Master Entrance
    // Ghost Watermark (Deepest parallax)
    tl.add('.ghost-watermark', {
      translateX: ['-35%', '-50%'],
      translateY: ['-50%', '-50%'],
      opacity: [0, 1],
      duration: 1400,
      easing: 'easeOutQuart'
    }, 50);

    // Main Telemetry Panel (Right axis)
    tl.add('.telemetry-right-axis', {
      translateY: [100, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutCubic'
    }, 200);

    // Footer Progress & Button
    tl.add('.final-execution-footer', {
      translateY: [50, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutQuad'
    }, 400);

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    // Enable floating after the entrance animations are likely done
    const timer = setTimeout(() => setIsFloating(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Simulate printing progress
    const speed = 2.0 / (printCopies || 1);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + speed;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [printCopies]);

  const handleManualExit = () => {
    animate(screenRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 500,
      easing: 'easeInQuad',
      onComplete: onFinish
    });
  };

  return (
    <div ref={screenRef} className="panel-whole panel-center-content charcoal-mica-background mica-blur-background">

      {/* 1. Kanvas Global & Ghost Watermark */}
      <div className="ghost-watermark">
        ARCH<br />IVE
      </div>

      {/* 2. Sumbu Kiri: Masterpiece */}
      <div className="masterpiece-left-axis">
        {finalImage && (
          <div className={`masterpiece-container ${!isFloating ? 'no-float' : ''}`}>
            <img src={finalImage} alt="The Final Print" />
          </div>
        )}
      </div>

      {/* 3. Sumbu Kanan: Telemetry Stack */}
      <div className="telemetry-right-axis">
        <div style={{ position: 'relative' }}>
          {/* <div className="hero-title-halo dark" /> */}
          <h1 className="telemetry-title">YOUR AMAZING DIGITAL ARCHIVE</h1>
        </div>

        <div className="qr-scanner-monument">
          <div className="qr-crop-marks">
            <span></span>
          </div>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: "white",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: devFreeFlow ? 'pointer' : 'default'
            }}
            onClick={(e) => {
              if (devFreeFlow && e.detail === 2) {
                console.log("[DevFreeFlow] Double-tap QR skip triggered.");
                onFinish();
              }
            }}
          >
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://hypebox.id/download/${kioskId}-${Date.now()}`}
              alt="Download QR"
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
            />
          </div>
        </div>

        <div className="metadata-stack">
          <div className="metadata-item">LINK: ARCHIVE.PHOTOS/{kioskId}</div>
          <div className="metadata-item">TERMINAL: {kioskId}</div>
          <div className="metadata-item">STATUS: ENCRYPTED & SECURE</div>
        </div>

        <div className="security-notice-minimal">
          <span>SECURITY ADVISORY:</span> PLEASE MANUALLY EXIT TO CLEAR YOUR DATA. LEAVING THIS SCREEN ACTIVE ALLOWS OTHERS TO ACCESS YOUR DOWNLOAD LINK.
        </div>
      </div>

      {/* 4. Eksekusi Final: Printer & Exit */}
      <div className="final-execution-footer">
        <div className="printer-status-bar">
          <div className="printer-status-label">
            <span>MATERIALIZING PHYSICAL PRINTS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="printer-progress-track">
            <div className="printer-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {progress >= 100 && (
          <button className="btn-tier-1" onClick={handleManualExit}>
            COMPLETE SESSION ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ExportScreen;
