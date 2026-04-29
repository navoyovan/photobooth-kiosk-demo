import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const ExportScreen = ({ finalImage, printCopies, onFinish, kioskId }) => {
  const screenRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Initial State
    // Forced block in JSX

    // 2. The Master Sequence - HALVED

    // Parallax Slide-in from Right to Left - HALVED
    // Ghost Watermark (Deepest parallax)
    tl.from(".ghost-watermark", {
      x: 300,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out"
    }, 0.05);

    // Masterpiece axis (the card) intentionally left static for shared-element feel
    gsap.set(".masterpiece-left-axis", { opacity: 1, x: 0 });

    // Right Axis (QR & Info) - HALVED
    tl.from(".telemetry-right-axis", {
      x: 150,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    }, 0.2);

    // Note: masterpiece-left-axis (the card) is skipped here 
    // to maintain continuity with the Checkout transition.

    // Footer - HALVED
    tl.from(".final-execution-footer", {
      y: 50,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out"
    }, 0.3);

  }, { scope: screenRef });

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
    gsap.to(screenRef.current, { opacity: 0, scale: 0.95, duration: 0.5, onComplete: onFinish });
  };

  return (
    <div ref={screenRef} className="delivery-hub-layout">

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
        <h1 className="telemetry-title">YOUR AMAZING DIGITAL ARCHIVE</h1>

        <div className="qr-scanner-monument">
          <div className="qr-crop-marks">
            <span></span>
          </div>
          <div style={{ width: '100%', height: '100%', background: "rgba(var(--theme-surface-dark-rgb), 0.1)", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Placeholder for QR Code */}
            <div style={{ textAlign: 'center', color: "rgb(var(--theme-text-muted-rgb))", fontFamily: 'Space Grotesk', fontSize: '0.6rem' }}>
              SCAN TO DOWNLOAD
            </div>
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
