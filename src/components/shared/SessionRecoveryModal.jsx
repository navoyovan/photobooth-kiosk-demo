import React, { useState, useEffect, useRef } from 'react';
import { animate } from 'animejs';
import styles from './SessionRecoveryModal.module.css';
import { getFrameLayout } from '../../constants/frame_layouts';
import { TRANSLATIONS } from '../../constants/translations';
import { CtaButton, SecondaryButton } from '../../ui';


const SessionRecoveryModal = ({ isOpen, onContinue, onDiscard, sessionData, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const modalRef = useRef();
  const overlayRef = useRef();

  const [active, setActive] = useState(isOpen);
  const hasAnimatedIn = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setActive(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && active && !hasAnimatedIn.current && modalRef.current) {
      hasAnimatedIn.current = true;
      animate(overlayRef.current, {
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuad'
      });
      animate(modalRef.current, {
        scale: [0.95, 1],
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
      });
    } else if (!isOpen && active && hasAnimatedIn.current) {
      hasAnimatedIn.current = false;
      animate(overlayRef.current, {
        opacity: 0,
        duration: 400,
        easing: 'easeInQuad'
      });
      animate(modalRef.current, {
        scale: 0.95,
        opacity: 0,
        translateY: 20,
        duration: 500,
        easing: 'easeInCubic',
        onComplete: () => setActive(false)
      });
    }
  }, [isOpen, active]);

  if (!active) return null;

  const { capturedPhotos = [], selectedFrame, currentStep } = sessionData;
  const totalSlots = selectedFrame?.slots || 1;
  const photosTaken = capturedPhotos.filter(p => !!p).length;

  const filledPhotos = Array.from({ length: totalSlots }).map((_, i) => capturedPhotos[i] || '/taken_pic/default.png');
  const layout = selectedFrame ? getFrameLayout(selectedFrame) : [];

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      style={{ opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        style={{ opacity: 0 }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{t('resumeSessionModalTitle')}</h2>
        </div>

        <div className={styles.previewContainer}>
          <div className={styles.previewMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{t('progressLabel')}</span>
              <span className={styles.metaValue}>{Math.round((photosTaken / totalSlots) * 100)}% {t('completeLabel')}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{t('lastStepLabel')}</span>
              <span className={styles.metaValue}>{['IDLE', 'PAYMENT', 'SELECTION', 'CAPTURE', 'CHECKOUT', 'EXPORT'][currentStep] || 'PROCESSING'}</span>
            </div>
          </div>

          <div className={styles.visualStack}>
            <div className={styles.framePreview}>
              {selectedFrame ? (
                <img src={selectedFrame.thumbnail} alt="Frame" className={styles.frameImg} style={{ zIndex: 10, position: 'relative', pointerEvents: 'none' }} />
              ) : (
                <img src="/taken_pic/default.png" alt="Default" className={styles.frameImg} style={{ opacity: 0.1, zIndex: 10, position: 'relative' }} />
              )}

              <div className={styles.photosGrid} style={{ padding: 0 }}>
                {filledPhotos.map((photo, i) => {
                  const slot = layout[i] || { x: 0, y: 0, w: 100, h: 100 };
                  return (
                    <div
                      key={i}
                      className={styles.photoSlot}
                      style={{
                        position: 'absolute',
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        width: `${slot.w}%`,
                        height: `${slot.h}%`,
                        borderRadius: 0,
                        background: 'transparent'
                      }}
                    >
                      <img
                        src={photo}
                        alt={`Slot ${i}`}
                        className={styles.capturedImg}
                        style={{ opacity: capturedPhotos[i] ? 1 : 0.4 }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <SecondaryButton onClick={onDiscard}>
            {t('discardResetBtn')}
          </SecondaryButton>
          <CtaButton onClick={onContinue} style={{ marginTop: 0 }}>
            {t('resumeSessionBtn')}
          </CtaButton>
        </div>

        <div className={styles.footer}>
          CERTIFICATE_ID: {sessionData.timestamp} // AUTH_HANDSHAKE: OK
        </div>
      </div>
    </div>
  );
};

export default SessionRecoveryModal;
