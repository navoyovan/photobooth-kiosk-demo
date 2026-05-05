import React, { useRef, useState, useEffect } from 'react';
import { animate, createTimeline } from 'animejs';
import { entranceAqcuisitionLayout } from '../../utils/transitions';
import { convertToWebP, saveToLocalStarfield } from '../../utils/imageProcessor';
import styles from './05-Export.module.css';

const ExportScreen = ({ finalImage, printCopies, onFinish, kioskId, devFreeFlow }) => {
  const screenRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const telemetryAxisRef = useRef(null);
  const footerRef = useRef(null);
  const watermarkRef = useRef(null);

  const timelineRef = useRef(null);
  const [isDonating, setIsDonating] = useState(false);
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // 1. Master Entrance
    entranceAqcuisitionLayout(tl, {
      elements: {
        watermark: watermarkRef.current,
        telemetry: telemetryAxisRef.current
      }
    });

    // // Ghost Watermark (Deepest parallax)
    // tl.add('.ghost-watermark', {
    //   translateX: ['-35%', '-50%'],
    //   translateY: ['-50%', '-50%'],
    //   opacity: [0, 1],
    //   duration: 1400,
    //   easing: 'easeOutQuart'
    // }, 50);

    // Main Telemetry Panel (Right axis)
    // tl.add('.telemetry-right-axis', {
    //   translateY: [100, 0],
    //   opacity: [0, 1],
    //   duration: 800,
    //   easing: 'easeOutCubic'
    // }, 200);

    // Footer Progress & Button
    if (footerRef.current) {
      tl.add(footerRef.current, {
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad'
      }, 400);
    }

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

  const handleManualExit = async () => {
    if (isDonating && finalImage) {
      setIsProcessingDonation(true);
      try {
        const webpBlob = await convertToWebP(finalImage);
        await saveToLocalStarfield(webpBlob);
      } catch (err) {
        console.error("[Export] Donation failed:", err);
      }
      setIsProcessingDonation(false);
    }

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
      <div ref={watermarkRef} className="ghost-watermark">
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
      <div ref={telemetryAxisRef} className="telemetry-right-axis">
        <div style={{ position: 'relative' }}>
          {/* <div className="hero-title-halo dark" /> */}
          <h1 className={styles.telemetryTitle}>YOUR AMAZING DIGITAL ARCHIVE</h1>
        </div>

        <div className="qr-box" style={{ margin: '0 0 2rem 0', alignSelf: 'flex-start', position: 'relative', width: '280px', height: '280px' }}>
          <div className="qr-crop-marks">
            <span></span>
          </div>

          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://hypebox.id/download/${kioskId}-${Date.now()}`}
            alt="Download QR"
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'contain',
              zIndex: 5,
              cursor: devFreeFlow ? 'pointer' : 'default'
            }}
            onClick={(e) => {
              if (devFreeFlow && e.detail === 2) {
                console.log("[DevFreeFlow] Double-tap QR skip triggered.");
                onFinish();
              }
            }}
          />
        </div>

        <div className={styles.metadataStack}>
          <div className={styles.metadataItem}>LINK: ARCHIVE.PHOTOS/{kioskId}</div>
          <div className={styles.metadataItem}>TERMINAL: {kioskId}</div>
          <div className={styles.metadataItem}>STATUS: ENCRYPTED & SECURE</div>
        </div>

        <div className={styles.securityNotice}>
          <span>SECURITY ADVISORY:</span> PLEASE MANUALLY EXIT TO CLEAR YOUR DATA. LEAVING THIS SCREEN ACTIVE ALLOWS OTHERS TO ACCESS YOUR DOWNLOAD LINK.
        </div>
      </div>

      {/* 4. Eksekusi Final: Printer & Exit */}
      <div ref={footerRef} className={styles.footer}>
        <div className={styles.printerStatusBar}>
          <div className={styles.printerStatusLabel}>
            <span>MATERIALIZING PHYSICAL PRINTS</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className={styles.printerProgressTrack}>
            <div className={styles.printerProgressFill} style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className={styles.finalActions}>
          <label className={styles.donateToggle}>
            <input 
              type="checkbox" 
              checked={isDonating} 
              onChange={(e) => setIsDonating(e.target.checked)} 
              disabled={isProcessingDonation}
            />
            <span className={styles.donateLabel}>
              {isProcessingDonation ? 'PROCESING_DONATION...' : 'DONATE_TO_COMMUNITY_STARFIELD'}
            </span>
          </label>
          
          <button 
            className="btn-tier-1" 
            onClick={handleManualExit}
            disabled={isProcessingDonation || progress < 100}
            style={{ opacity: progress < 100 ? 0.3 : 1, cursor: progress < 100 ? 'not-allowed' : 'pointer' }}
          >
            {isProcessingDonation ? 'WAIT...' : (progress < 100 ? 'PRINTING_IN_PROGRESS...' : 'COMPLETE SESSION ✕')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportScreen;
