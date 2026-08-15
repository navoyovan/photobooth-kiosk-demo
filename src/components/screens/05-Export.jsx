import React, { useRef, useState, useEffect } from 'react';
import { animate, createTimeline } from 'animejs';
import { entranceAqcuisitionLayout } from '../../utils/transitions';
import { convertToWebP, saveToLocalStarfield } from '../../utils/imageProcessor';
import { getBackendUrl, getMachineUUID } from '../../utils/kioskId';
import { TRANSLATIONS } from '../../constants/translations';
import styles from './05-Export.module.css';
import { PrimaryButton, SquareWaveLoader } from '../../ui';

const ExportScreen = ({ finalImage, capturedPhotos = [], printCopies, onFinish, kioskId, devFreeFlow, sessionHash, selectedFrame, language = 'EN', allowCloudUpload = true }) => {
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

  // Helper to convert base64 data URL to Blob for multipart upload
  const base64ToBlob = (dataUrl) => {
    try {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (e) {
      console.error('[Export] Error converting base64 to blob:', e);
      return null;
    }
  };

  // Primary Provider: Tmpfiles.org (Renders preview page with download button)
  const uploadToTmpfiles = async (dataUrl, hash) => {
    const blob = base64ToBlob(dataUrl);
    if (!blob) throw new Error('Could not convert base64 to blob');

    const formData = new FormData();
    formData.append('file', blob, `hypebox_${hash || 'photo'}.jpg`);

    const res = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`Tmpfiles HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === 'success' && data.data?.url) {
      // Returns the official viewing page (e.g. https://tmpfiles.org/123456/photo.jpg)
      return data.data.url;
    }
    throw new Error(data.message || 'Tmpfiles upload error');
  };

  // Secondary Fallback: FreeImage.host
  const uploadToFreeImage = async (dataUrl) => {
    const base64Content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('action', 'upload');
    formData.append('source', base64Content);
    formData.append('format', 'json');

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(`FreeImage HTTP ${res.status}`);
    const data = await res.json();
    if (data.status_code === 200 && data.image?.url) {
      return data.image.url;
    }
    throw new Error(data.error?.message || 'FreeImage upload error');
  };

  useEffect(() => {
    let active = true;

    if (!allowCloudUpload) {
      setUploading(false);
      setDownloadUrl('');
      setResolvedHash(sessionHash);
      return;
    }

    const uploadSession = async () => {
      const startTime = Date.now();
      const minDuration = 2500; // Allow SquareWaveLoader to complete full wave cycle

      try {
        setUploading(true);
        setUploadError(false);

        let viewingUrl = null;

        // 1. Try Tmpfiles.org (Viewer Page)
        try {
          viewingUrl = await uploadToTmpfiles(finalImage, sessionHash);
        } catch (err1) {
          console.warn('[Export] Tmpfiles failed, falling back to FreeImage:', err1);
          // 2. Fallback to FreeImage.host
          try {
            viewingUrl = await uploadToFreeImage(finalImage);
          } catch (err2) {
            console.warn('[Export] FreeImage failed too:', err2);
          }
        }

        const validUrl = viewingUrl || `https://hypebox.id/archive/${sessionHash || 'demo'}`;

        // Preload QR Code image before flipping upload state so it never displays broken alt text
        const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(validUrl)}`;
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
          img.src = qrCodeApiUrl;
        });

        // Ensure loader has its full cinematic moment
        const elapsed = Date.now() - startTime;
        if (elapsed < minDuration) {
          await new Promise((r) => setTimeout(r, minDuration - elapsed));
        }

        if (active) {
          if (!viewingUrl) {
            setUploadError(true);
          }
          setDownloadUrl(validUrl);
          setResolvedHash(sessionHash);
        }
      } catch (err) {
        console.error('[Export] All upload providers failed:', err);
        const elapsed = Date.now() - startTime;
        if (elapsed < minDuration) {
          await new Promise((r) => setTimeout(r, minDuration - elapsed));
        }
        if (active) {
          setUploadError(true);
          setDownloadUrl(`https://hypebox.id/archive/${sessionHash || 'demo'}`);
        }
      } finally {
        if (active) {
          setUploading(false);
        }
      }
    };

    if (finalImage) {
      uploadSession();
    } else {
      // Fallback demo timeout if no finalImage present
      const timer = setTimeout(() => {
        if (active) {
          setDownloadUrl(`https://hypebox.id/archive/${sessionHash || 'demo'}`);
          setUploading(false);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }

    return () => {
      active = false;
    };
  }, [finalImage, sessionHash, allowCloudUpload]);

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

          <div
            className={`qr-box ${!allowCloudUpload ? styles.disabledQrBox : ''}`}
            style={{ margin: '1rem 0 2.5rem 0', alignSelf: 'flex-start', position: 'relative', width: '280px', height: '280px', background: '#fff' }}
          >
            <div className="qr-crop-marks">
              <span></span>
            </div>

            {!allowCloudUpload ? (
              <>
                <div className={styles.disabledCrossOverlay} />
                <div className={styles.disabledContainer}>
                  <span className={styles.disabledTag}>{t('uploadOptedOut')}</span>
                  <p className={styles.disabledSub}>{t('uploadOptedOutDesc')}</p>
                </div>
              </>
            ) : uploading ? (
              <div className={styles.qrContainer}>
                <SquareWaveLoader color="#111111" size={12} gap={8} />
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
              {t('artifactLink')} // {!allowCloudUpload ? t('linkOptedOut') : (uploading ? t('statusTransmitting') : (downloadUrl.replace(/^https?:\/\//, '').substring(0, 26) + (downloadUrl.length > 26 ? '...' : '')))}
            </div>
            <div className={styles.metadataItem}>
              {t('statusLabel')} // {!allowCloudUpload ? t('statusOptedOut') : (uploading ? t('statusTransmitting') : (uploadError ? t('statusOffline') : t('statusEncrypted')))}
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
              <span className={`${styles.donateLabel} ${!isDonating ? styles.strikethrough : ''}`}>
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
