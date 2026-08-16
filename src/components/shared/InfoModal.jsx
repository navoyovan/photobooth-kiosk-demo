import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { TRANSLATIONS } from '../../constants/translations';
import { SecondaryButton } from '../../ui';
import styles from './InfoModal.module.css';

const InfoModal = ({ isOpen, onClose, language = 'EN' }) => {
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
        <div className={styles.header}>
          <div>
            <div className={styles.tagline}>{t('aboutTagline') || 'EXPERIENCE PLATFORM'}</div>
            <h2 className={styles.title}>{t('aboutTitle') || 'ABOUT HYPE-BOX'}</h2>
          </div>
        </div>

        <h3 className={styles.headline}>
          {t('aboutHeadline') || 'A DIGITAL PHOTOBOOTH EXPERIENCE BUILT FOR PHYSICAL SPACES.'}
        </h3>

        <p className={styles.description}>
          {t('aboutDesc') || 'An interactive kiosk experience designed for exhibitions, venues, and high-velocity spatial activations with instant digital QR archiving.'}
        </p>

        <div className={styles.metaSection}>
          <span className={styles.versionLabel}>{t('demoVersionLabel') || 'DEMO VERSION'}</span>
          <span className={styles.versionValue}><v1 className="2"></v1></span>
        </div>

        <div className={styles.statusMatrix}>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('featurePrinting') || 'PRINTING'}</span>
            <span className={styles.statusDisabled}>—</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('featurePayment') || 'PAYMENT'}</span>
            <span className={styles.statusDisabled}>—</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('featureDigital') || 'DIGITAL (limited)'}</span>
            <span className={styles.statusActive}>✓</span>
          </div>
          <div className={styles.statusRow}>
            <span className={styles.statusLabel}>{t('featureCamera') || 'CAMERA'}</span>
            <span className={styles.statusActive}>✓</span>
          </div>
        </div>

        <SecondaryButton
          onClick={handleClose}
          style={{ width: '100%' }}
        >
          {t('closeModalBtn') || 'CLOSE ×'}
        </SecondaryButton>
      </div>
    </div>
  );
};

export default InfoModal;
