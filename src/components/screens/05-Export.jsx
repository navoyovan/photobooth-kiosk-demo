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
  const [isDonating, setIsDonating] = useState(true);
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
    animate(screenRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 500,
      easing: 'easeInQuad',
      onComplete: () => onFinish(isDonating)
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

      {/* 3. Sumbu Kanan: Telemetry Stack (Full Height Column) */}
      <div ref={telemetryAxisRef} className="telemetry-right-axis" style={{ justifyContent: 'flex-start' }}>

        {/* TOP SECTION: IDENTIFIERS */}
        <div className={styles.topSection}>
          <h1 className={styles.telemetryTitle}>YOUR AMAZING DIGITAL ARCHIVE</h1>

          <div className="qr-box" style={{ margin: '1rem 0 2.5rem 0', alignSelf: 'flex-start', position: 'relative', width: '280px', height: '280px', background: '#fff' }}>
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
            <div className={styles.metadataItem}>Artifact Link // archive.photos/{kioskId}</div>
            <div className={styles.metadataItem}>Status // Encrypted & Secured</div>
          </div>

          <div className={styles.securityNotice}>
            <span>SECURITY ADVISORY:</span> Please manually exit to clear your temporary data. Remaining on this screen may allow others to access your archive.
          </div>
        </div>

        {/* BOTTOM SECTION: MATERIALIZATION & FINISH (NOW INSIDE THE AXIS) */}
        <div className={styles.bottomSection}>
          <div className={styles.printerStatusBar}>
            <div className={styles.printerStatusLabel}>
              <span>Materializing Physical Prints</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className={styles.printerProgressTrack}>
              <div className={styles.printerProgressFill} style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className={styles.finalActions}>
            <div
              className={`${styles.donateToggle} ${isDonating ? styles.isDonating : ''}`}
              onClick={() => !isProcessingDonation && setIsDonating(!isDonating)}
            >
              <span className={styles.bracket}>
                {isProcessingDonation ? '[ … ]' : (isDonating ? '[ ■ ]' : '[   ]')}
              </span>
              <span className={styles.donateLabel}>
                {isProcessingDonation ? 'Processing archive...' : 'Grant exhibition rights to public gallery wall.'}
              </span>
            </div>

            <button
              className={`btn-primary ${styles.finishBtn}`}
              onClick={handleManualExit}
              disabled={isProcessingDonation || progress < 100}
              style={{ opacity: progress < 100 ? 0.3 : 1, cursor: progress < 100 ? 'not-allowed' : 'pointer', width: '100%', maxWidth: '30rem' }}
            >
              {isProcessingDonation ? 'WAIT...' : (progress < 100 ? 'MATERIALIZING...' : 'END SESSION ✕')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExportScreen;
