import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { TRANSLATIONS } from '../../constants/translations';
import { SecondaryButton } from '../../ui';
import styles from './PrivacyModal.module.css';

const PrivacyModal = ({ isOpen, onClose, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current) {
      animate(overlayRef.current, {
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutQuad'
      });
      animate(modalRef.current, {
        opacity: [0, 1],
        scale: [0.95, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutCubic'
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (overlayRef.current && modalRef.current) {
      animate(overlayRef.current, {
        opacity: 0,
        duration: 300,
        easing: 'easeInQuad'
      });
      animate(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        translateY: 15,
        duration: 300,
        easing: 'easeInQuad',
        onComplete: onClose
      });
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleClose}
      style={{ opacity: 0 }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: 0 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.tagline}>{t('privacyTagline') || 'DATA & HARDWARE DISCLOSURE'}</div>
            <h2 className={styles.title}>{t('privacyTitle') || 'PRIVACY STATEMENT'}</h2>
          </div>
        </div>

        {/* Lead Headline & Overview */}
        <h3 className={styles.headline}>
          {t('privacyHeadline') || 'TRANSPARENT CLIENT-SIDE ARCHITECTURE. ZERO AD TRACKING.'}
        </h3>

        <p className={styles.description}>
          {t('privacyDesc') || 'This kiosk demo operates on a privacy-first model. We do not use third-party analytics, tracking pixels, or advertising identifiers. All primary processing remains strictly on your device.'}
        </p>

        {/* 5 Core Privacy Pillars */}
        <div className={styles.pillarList}>
          {/* Pillar 1: Camera Permissions */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span className={styles.pillarNumber}>01</span>
              <span className={styles.pillarTitle}>{t('privacyPillarCameraTitle') || 'Optics & Camera Permissions'}</span>
              <span className={styles.pillarBadge}>{t('privacyBadgeClient') || 'CLIENT-SIDE'}</span>
            </div>
            <p className={styles.pillarText}>
              {t('privacyPillarCameraDesc') || 'Camera access is utilized exclusively for real-time in-browser live viewfinder preview and photo capture. Live video feeds are never recorded or transmitted to remote servers during active capture.'}
            </p>
          </div>

          {/* Pillar 2: Local Storage & Preferences */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span className={styles.pillarNumber}>02</span>
              <span className={styles.pillarTitle}>{t('privacyPillarStorageTitle') || 'Local Storage & Preferences'}</span>
              <span className={styles.pillarBadge}>{t('privacyBadgeDevice') || 'ON-DEVICE'}</span>
            </div>
            <p className={styles.pillarText}>
              {t('privacyPillarStorageDesc') || 'Browser localStorage is used solely to maintain active session recovery (in case of accidental refresh), UI theme preferences, and demo configurations. No tracking cookies or advertising identifiers are ever placed.'}
            </p>
          </div>

          {/* Pillar 3: Custom Frame Uploads */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span className={styles.pillarNumber}>03</span>
              <span className={styles.pillarTitle}>{t('privacyPillarFrameTitle') || 'Custom Frame Uploads'}</span>
              <span className={styles.pillarBadge}>{t('privacyBadgeLocal') || 'LOCAL ONLY'}</span>
            </div>
            <p className={styles.pillarText}>
              {t('privacyPillarFrameDesc') || 'Custom PNG frames and layout presets uploaded in the studio are parsed and chroma-keyed directly inside browser memory and saved to your device storage. They are never uploaded to any remote server.'}
            </p>
          </div>

          {/* Pillar 4: Ephemeral Cloud Delivery */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span className={styles.pillarNumber}>04</span>
              <span className={styles.pillarTitle}>{t('privacyPillarCloudTitle') || 'Ephemeral Digital Delivery (60-Min)'}</span>
              <span className={styles.pillarBadge}>{t('privacyBadgeEphemeral') || 'OPT-OUT AVAILABLE'}</span>
            </div>
            <p className={styles.pillarText}>
              {t('privacyPillarCloudDesc') || 'Rendered composite prints are temporarily uploaded to public cloud hosting solely to generate mobile retrieval QR codes. All uploaded files automatically purge after 60 minutes. An opt-out consent checkbox is provided at checkout to keep all sessions completely offline.'}
            </p>
          </div>

          {/* Pillar 5: Exhibition Gallery Wall */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarHeader}>
              <span className={styles.pillarNumber}>05</span>
              <span className={styles.pillarTitle}>{t('privacyPillarGalleryTitle') || 'Community Exhibition Gallery'}</span>
              <span className={styles.pillarBadge}>{t('privacyBadgeOptIn') || 'OPT-IN ONLY'}</span>
            </div>
            <p className={styles.pillarText}>
              {t('privacyPillarGalleryDesc') || 'At the end of your session, you can choose whether to donate your photo to the local kiosk starfield background. Consented photos are stored strictly in local browser IndexedDB with all EXIF metadata stripped.'}
            </p>
          </div>
        </div>

        {/* Footer Action */}
        <SecondaryButton
          onClick={handleClose}
          style={{ width: '100%', marginTop: '1.5rem' }}
        >
          {t('closeModalBtn') || 'CLOSE ×'}
        </SecondaryButton>
      </div>
    </div>
  );
};

export default PrivacyModal;
