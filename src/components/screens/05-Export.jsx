import React, { useRef, useState, useEffect } from 'react';
import { animate, createTimeline } from 'animejs';
import { entranceAqcuisitionLayout } from '../../utils/transitions';
import { convertToWebP, saveToLocalStarfield } from '../../utils/imageProcessor';
import { getBackendUrl, getMachineUUID } from '../../utils/kioskId';
import { TRANSLATIONS } from '../../constants/translations';
import styles from './05-Export.module.css';
import { PrimaryButton } from '../../ui';

const ExportScreen = ({ finalImage, capturedPhotos = [], printCopies, onFinish, kioskId, devFreeFlow, sessionHash, selectedFrame, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const telemetryAxisRef = useRef(null);
  const footerRef = useRef(null);
  const watermarkRef = useRef(null);

  const timelineRef = useRef(null);
  const [isDonating, setIsDonating] = useState(true);
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);

  const [uploading, setUploading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [resolvedHash, setResolvedHash] = useState(sessionHash);

  useEffect(() => {
    let active = true;
    const uploadSession = async () => {
      try {
        setUploading(true);
        setUploadError(false);

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/kiosk/upload-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kiosk_uuid: getMachineUUID(),
            final_image: finalImage,
            raw_photos: capturedPhotos,
            session_hash: sessionHash,
            frame_id: selectedFrame?.id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Upload response status: ${response.status}`);
        }

        const data = await response.json();
        if (active) {
          if (data.success) {
            setDownloadUrl(data.download_url);
            if (data.hash) {
              setResolvedHash(data.hash);
            }
          } else {
            throw new Error(data.message || 'Upload failed');
          }
        }
      } catch (err) {
        console.error('[Export] Upload failed:', err);
        if (active) {
          setUploadError(true);
          // Local fallback
          setDownloadUrl(`${getBackendUrl()}/download/offline-fallback`);
        }
      } finally {
        if (active) {
          setUploading(false);
        }
      }
    };

    if (finalImage) {
      uploadSession();
    }

    return () => {
      active = false;
    };
  }, [finalImage, capturedPhotos]);

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
        {t('exportWatermark')}
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
          <h1 className={styles.telemetryTitle}>{t('digitalArchiveTitle')}</h1>

          <div className="qr-box" style={{ margin: '1rem 0 2.5rem 0', alignSelf: 'flex-start', position: 'relative', width: '280px', height: '280px', background: '#fff' }}>
            <div className="qr-crop-marks">
              <span></span>
            </div>

            {uploading ? (
              <div className={styles.qrContainer}>
                <div className={styles.qrScannerLine} />
                <div className={styles.loaderRing} />
                <span className={styles.loadingLabel}>{t('syncingVault')}</span>
              </div>
            ) : (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(downloadUrl)}`}
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
            )}
          </div>

          <div className={styles.metadataStack}>
            <div className={styles.metadataItem}>
              {t('sessionId')} // {resolvedHash}
            </div>
            <div className={styles.metadataItem}>
              {t('artifactLink')} // {uploading ? t('statusTransmitting') : (downloadUrl.replace(/^https?:\/\//, '').substring(0, 26) + (downloadUrl.length > 26 ? '...' : ''))}
            </div>
            <div className={styles.metadataItem}>
              {t('statusLabel')} // {uploading ? t('statusTransmitting') : (uploadError ? t('statusOffline') : t('statusEncrypted'))}
            </div>
          </div>

          <div className={styles.securityNotice}>
            {t('securityAdvisory')}
          </div>
        </div>

        {/* BOTTOM SECTION: MATERIALIZATION & FINISH (NOW INSIDE THE AXIS) */}
        <div className={styles.bottomSection}>
          <div className={styles.printerStatusBar}>
            <div className={styles.printerStatusLabel}>
              <span>{t('materializingPrints')}</span>
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
                {isProcessingDonation ? t('syncingVault') : t('exhibitionRightsConsent')}
              </span>
            </div>

            <PrimaryButton
              onClick={handleManualExit}
              disabled={isProcessingDonation || progress < 100}
              style={{ opacity: progress < 100 ? 0.3 : 1, cursor: progress < 100 ? 'not-allowed' : 'pointer' }}
            >
              {isProcessingDonation ? t('wait') : (progress < 100 ? t('materializing') : t('endSession'))}
            </PrimaryButton>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default ExportScreen;
