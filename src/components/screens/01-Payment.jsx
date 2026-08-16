import React, { useState, useRef, useEffect, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, createTimeline } from 'animejs';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';
import SessionRecoveryModal from '../shared/SessionRecoveryModal';
import CardStackOdometer from '../shared/CardStackOdometer';
import InfoModal from '../shared/InfoModal';
import { CtaButton } from '../../ui';
import { TRANSLATIONS } from '../../constants/translations';
import styles from './01-Payment.module.css';
import { assetUrl } from '../../utils/assetUrl';

const PaymentScreen = forwardRef(({ onBack, onSuccess, printCopies, setPrintCopies, timerDisplay, transactionTime, setIsTimerPaused, kioskId, onRestoreSession, selectedFrame, bypassMode = false, devFreeFlow = false, language = 'EN', setLanguage, isCheckoutOpen, setIsCheckoutOpen }, ref) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef();
  const leftPanelRef = useRef();
  const rightPanelRef = useRef();

  const [internalCheckoutOpen, setInternalCheckoutOpen] = useState(false);
  const isCheckoutModalOpen = isCheckoutOpen !== undefined ? isCheckoutOpen : internalCheckoutOpen;
  const setIsCheckoutModalOpen = setIsCheckoutOpen || setInternalCheckoutOpen;

  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  // Check for saved session on mount
  useEffect(() => {
    const rawSession = localStorage.getItem('photobooth_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        const isRecent = Date.now() - session.timestamp < 30 * 60 * 1000;
        // Maximum at checkout page (steps 1 through 4 only). Export (5) and Outro (6) are never recovered.
        const isValidStep = session.currentStep >= 1 && session.currentStep <= 4;
        const hasSessionState = (session.currentStep >= 2) ||
          (session.selectedFrame !== null && session.selectedFrame !== undefined) ||
          (Array.isArray(session.capturedPhotos) && session.capturedPhotos.some(p => !!p)) ||
          ((session.amountPaid || 0) > 0);

        if (isRecent && isValidStep && hasSessionState) {
          setSavedSession(session);
          setShowRecoveryModal(true);
        } else {
          localStorage.removeItem('photobooth_session');
        }
      } catch (e) {
        console.error("Failed to parse saved session", e);
      }
    }
  }, []);

  const handleContinueSession = () => {
    if (savedSession) {
      onRestoreSession(savedSession);
      setShowRecoveryModal(false);
    }
  };

  const handleDiscardSession = () => {
    localStorage.removeItem('photobooth_session');
    setShowRecoveryModal(false);
    setSavedSession(null);
  };

  const timelineRef = useRef(null);
  useLayoutEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    tl.add(screenRef.current, {
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    }, 0);

    entranceEditorialLayout(tl, { duration: 800 });

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  const handleCancel = () => {
    animate(screenRef.current, {
      opacity: 0,
      translateY: 40,
      duration: 600,
      easing: 'easeInCubic',
      onComplete: onBack
    });
  };

  useImperativeHandle(ref, () => ({
    exit: handleCancel
  }));

  const handlePaymentSuccess = () => {
    setIsTimerPaused?.(true);
    const exitTl = createTimeline({
      onComplete: () => {
        setIsTimerPaused?.(false);
        onSuccess(0);
      }
    });

    exitEditorialLayout(exitTl, { duration: 450 });
  };

  const handleConfirmCheckout = () => {
    setIsCheckoutModalOpen(true);
  };

  const handleSetCopies = (val) => {
    if (val < 1 || val > 10) return;
    setPrintCopies(val);
  };

  const isAnyModalOpen = isCheckoutModalOpen || isInfoModalOpen || showRecoveryModal;

  return (
    <div
      ref={screenRef}
      className={`milky-mica-background ${isAnyModalOpen ? 'is-solid-mode' : ''} screen-container ${styles.screen}`}
      style={{
        zIndex: 10,
        opacity: 0
      }}
    >
      {/* PANEL KIRI: Kendali & Demo Overview */}
      <div ref={leftPanelRef} className="panel-left">
        {/* The Giant Watermark */}
        <h2 className="watermark-sideways">{t('demoWatermark')}</h2>

        {/* Floating Language Switcher & Info Action */}
        <div className={styles.langToggleContainer}>
          <button
            className={`${styles.langBtn} ${language === 'EN' ? styles.active : ''}`}
            onClick={() => setLanguage('EN')}
          >
            EN
          </button>
          <span className={styles.langDivider}>/</span>
          <button
            className={`${styles.langBtn} ${language === 'ID' ? styles.active : ''}`}
            onClick={() => setLanguage('ID')}
          >
            ID
          </button>

          <span className={styles.infoDivider}>|</span>

          <button
            className={styles.infoBtn}
            onClick={() => setIsInfoModalOpen(true)}
            aria-label="About Hypebox"
          >
            {t('infoBtnLabel')}
          </button>
        </div>

        <div style={{ width: '100%', marginTop: '8rem', marginBottom: 'auto', paddingBottom: '3rem', zIndex: 20 }}>
          {/* The Hero Overlap Title */}
          <div className="side-display-container">
            <div className="side-display-bullet">▌</div>
            <h2 className="side-display-h1">{t('paymentTitle')}</h2>
          </div>

          <div className={styles.instructionList}>
            <div className={styles.instructionStep}>
              <span className={styles.instructionNum}>01.</span>
              <p className={styles.instructionText}>{t('demoStep1')}</p>
            </div>
            <div className={styles.instructionStep}>
              <span className={styles.instructionNum}>02.</span>
              <p className={styles.instructionText}>{t('demoStep2')}</p>
            </div>
            <div className={styles.instructionStep}>
              <span className={styles.instructionNum}>03.</span>
              <p className={styles.instructionText}>{t('demoStep3')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL KANAN: Configuration & Action */}
      <div ref={rightPanelRef} className="panel-right panel-center-content">
        <div className={styles.checkoutPhase}>
          <div className={styles.checkoutBody}>
            <div className="qr-box" style={{ width: '600px', height: '250px', position: 'relative', overflow: 'visible', background: '#fff' }}>
              <div className="vf-corner tl"></div>
              <div className="vf-corner tr"></div>
              <div className="vf-corner bl"></div>
              <div className="vf-corner br"></div>
              <div className="boundary-dashed-line-visual"></div>

              <div className={styles.qrBoxContent}>
                <CardStackOdometer
                  count={printCopies}
                  onChange={handleSetCopies}
                  imageSrc={selectedFrame?.thumbnail || assetUrl('assets/payment_qty.webp')}
                  size="compact"
                  min={1}
                  max={10}
                />
              </div>
            </div>
          </div>

          <CtaButton className={styles.confirmBtn} onClick={handleConfirmCheckout}>
            {t('generatePaymentQR')}
          </CtaButton>
        </div>


        <div style={{
          marginTop: '2.5rem',
          fontFamily: 'Space Grotesk',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: "rgb(var(--theme-surface-dark-rgb))",
          textTransform: 'uppercase',
          letterSpacing: '0.1rem',
          textAlign: 'center',
          lineHeight: '1.6',
          maxWidth: '380px'
        }}>
          {t('demoHint')}
        </div>
      </div>

      {/* DEMO INTRODUCTION MODAL */}
      <GalleryCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        totalPrice={0}
        initialPayment={0}
        orderId={`DEMO-${Math.floor(Date.now() / 1000)}`}
        timeLeft={transactionTime}
        devFreeFlow={devFreeFlow}
        setIsTimerPaused={setIsTimerPaused}
        mode="PAYMENT"
        bypassMode={bypassMode}
        language={language}
      />

      <SessionRecoveryModal
        isOpen={showRecoveryModal}
        sessionData={savedSession}
        savedSession={savedSession}
        onContinue={handleContinueSession}
        onDiscard={handleDiscardSession}
        language={language}
      />

      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        language={language}
      />
    </div>
  );
});

export default PaymentScreen;
