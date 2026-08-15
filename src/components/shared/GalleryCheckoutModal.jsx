import React, { useState, useEffect, useRef } from 'react';
import { animate, createTimeline } from 'animejs';
import styles from './GalleryCheckoutModal.module.css';
import { getBackendUrl } from '../../utils/kioskId';
import { TRANSLATIONS } from '../../constants/translations';
import { SecondaryButton, PrimaryButton, CtaButton } from '../../ui';

// ---------------------------------------------------------------------------
// HYPEBOX DEMO INTRODUCTION SCREEN
// Rendered in place of the payment UI when mode === 'PAYMENT'.
// Keeps the modal shell (backdrop + .modal div + entrance/exit animation)
// but replaces all inner content with the demo intro.
// ---------------------------------------------------------------------------
const DemoIntroContent = ({ onStart, onClose, modalRef, successOverlayRef }) => (
  <div className={styles.demoRoot}>
    {/* Brand */}
    <div className={styles.demoBrand}>
      <span className={styles.demoBrandName}>HYPE-Box</span>
      <span className={styles.demoBrandSub}>INTERACTIVE PHOTO EXPERIENCE</span>
    </div>

    {/* Framed preview area — corner-bracket treatment preserved */}
    <div className={`qr-box ${styles.demoPreviewBox}`} style={{ position: 'relative' }}>
      <div className="vf-corner tl"></div>
      <div className="vf-corner tr"></div>
      <div className="vf-corner bl"></div>
      <div className="vf-corner br"></div>

      <img
        src="/assets/payment_qty.png"
        alt="Sample photo experience preview"
        className={styles.demoPreviewImg}
      />

      {/* <span className={styles.demoPreviewLabel}>PREVIEW / 01</span> */}
    </div>

    {/* Tagline */}
    <div className={styles.demoTagline}>CAPTURE — CUSTOMIZE — EXPORT</div>

    {/* Actions */}
    <div className={styles.demoActions}>
      <CtaButton onClick={onStart} style={{ width: '100%' }}>
        START EXPERIENCE ↗
      </CtaButton>
      <SecondaryButton onClick={onClose} style={{ width: '100%' }}>
        CANCEL
      </SecondaryButton>
    </div>

    {/* Footer system label */}
    <div className={styles.demoFooter}>DEMO UNIT / SYSTEM 01</div>
  </div>
);

const GalleryCheckoutModal = ({ isOpen, onClose, onSuccess, totalPrice, initialPayment = 0, orderId = "ORD-9921", timeLeft, devFreeFlow, setIsTimerPaused, mode = 'PAYMENT', onTimeout, bypassMode = false, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success'
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(10);
  const [isCountdownPaused, setIsCountdownPaused] = useState(false);
  const [agreedToUpload, setAgreedToUpload] = useState(true);
  const modalRef = useRef();
  const backdropRef = useRef();
  const qrRef = useRef();
  const primaryBtnRef = useRef();
  const successOverlayRef = useRef();

  const hasAnimatedIn = useRef(false);
  const [active, setActive] = useState(isOpen);

  // Sync active state with isOpen
  useEffect(() => {
    if (isOpen) {
      setActive(true);
    }
  }, [isOpen]);

  // Anime.js Entrance/Exit
  useEffect(() => {
    if (isOpen && active && !hasAnimatedIn.current && modalRef.current) {
      hasAnimatedIn.current = true;
      const tl = createTimeline();

      tl.add(backdropRef.current, {
        opacity: [0, 1],
        backdropFilter: ['blur(0px) brightness(1)', 'blur(20px) brightness(0.7)'],
        duration: 800,
        easing: 'easeOutQuad'
      });

      tl.add(modalRef.current, {
        translateY: [40, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 700,
        easing: 'easeOutCubic'
      }, '-=400');
    } else if (!isOpen && active && hasAnimatedIn.current) {
      hasAnimatedIn.current = false;
      const tl = createTimeline();

      tl.add(modalRef.current, {
        translateY: 30,
        opacity: 0,
        duration: 500,
        easing: 'easeInCubic'
      });

      tl.add(backdropRef.current, {
        opacity: 0,
        duration: 600,
        easing: 'easeInOutQuad',
        onComplete: () => {
          setActive(false);
          setTimeoutCountdown(10);
          setIsCountdownPaused(false);
        }
      }, '-=400');
    }
  }, [isOpen, active]);

  // Timeout Countdown Logic
  useEffect(() => {
    if (isOpen && mode === 'TIMEOUT' && timeoutCountdown > 0 && !isCountdownPaused) {
      const timer = setInterval(() => {
        setTimeoutCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeout?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, mode, timeoutCountdown, isCountdownPaused]);

  // WebSocket & QR generation logic
  useEffect(() => {
    // In PAYMENT mode (Hypebox Intro), CONFIRM mode, or bypass mode, skip QRIS generation
    if (!isOpen || mode === 'PAYMENT' || mode === 'CONFIRM' || mode === 'TIMEOUT' || bypassMode) {
      setIsLoading(false);
      return;
    }

    const fetchQr = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/qris/mock-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            "kiosk_id": "HYPEBOX-DEV-01",
            "package_id": "premium_grid",
            "amount": totalPrice - initialPayment
          })
        });

        if (!response.ok) throw new Error('Hardware Network Error');
        const data = await response.json();
        setQrData(data);
      } catch (err) {
        // Suppress console error in standalone demo mode and provide mock QR
        setQrData({ qr_string: "00020101021226580016ID.CO.SHOPEE.WWW01189360091800000000005204581253033605802ID5911HYPEBOX KIOSK6007JAKARTA61051234062070703A016304" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQr();

    // Global hook for dev console testing
    window.simulatePaymentSuccess = () => {
      console.log("[Mock WebSocket] Received: Paid!");
      handlePaymentSuccess();
    };

    return () => {
      delete window.simulatePaymentSuccess;
    };
  }, [isOpen, mode]);

  const handleExit = (callback) => {
    // This is now handled by the useEffect above when isOpen changes
    callback();
  };

  const handlePaymentSuccess = () => {
    if (paymentStatus === 'success') return;

    // Pause timers immediately as soon as action is accepted
    setIsCountdownPaused(true);
    setIsTimerPaused?.(true);

    // Transition Logic
    setPaymentStatus('success');

    const tl = createTimeline();

    // 1. QR artifact gently fades out
    tl.add(qrRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 600,
      easing: 'easeInOutQuad'
    }, 0);

    // 2. Simple checkmark fades in
    tl.add(successOverlayRef.current, {
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    }, '-=300');

    // 3. Modal dissolves and app glides forward
    tl.add(modalRef.current, {
      opacity: 0,
      translateY: -20,
      duration: 800,
      easing: 'easeInOutCubic'
    }, '+=1000');

    tl.add(backdropRef.current, {
      opacity: 0,
      duration: 800,
      easing: 'linear',
      onComplete: () => onSuccess?.(agreedToUpload)
    }, '-=500');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!active) return null;

  // --- DEMO INTRODUCTION SCREEN (mode === 'PAYMENT') ---
  // Entirely replaces the payment/QR UI with the Hypebox intro screen.
  // The backdrop + modal shell + entrance/exit animation are all reused.
  if (mode === 'PAYMENT') {
    return (
      <div
        ref={backdropRef}
        className={styles.backdrop}
        style={{ opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div
          ref={modalRef}
          className={`${styles.modal} ${styles.demoModal}`}
          style={{ opacity: 0 }}
        >
          <DemoIntroContent
            onStart={handlePaymentSuccess}
            onClose={onClose}
            modalRef={modalRef}
            successOverlayRef={successOverlayRef}
          />

          {/* Success Overlay (reused) */}
          <div
            ref={successOverlayRef}
            className={styles.successOverlay}
            style={{ pointerEvents: 'none' }}
          >
            <div className={styles.checkmark}>✓</div>
          </div>
        </div>
      </div>
    );
  }

  // --- DEMO CONFIRMATION SCREEN (mode === 'CONFIRM') ---
  if (mode === 'CONFIRM') {
    return (
      <div
        ref={backdropRef}
        className={styles.backdrop}
        style={{ opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
      >
        <div
          ref={modalRef}
          className={`${styles.modal} ${styles.demoModal}`}
          style={{ opacity: 0 }}
        >
          <div className={styles.confirmRoot}>
            {/* Top Section: Demo Session */}
            <div className={styles.confirmSection}>
              <span className={styles.sectionTag}>{t('demoSessionTag')}</span>
              <h2 className={styles.sectionHeadline}>{t('youreInDemo')}</h2>
              <p className={styles.sectionBody}>{t('demoUnavailableFeatures')}</p>
            </div>

            {/* Divider 1 */}
            <div className={styles.confirmDivider} />

            {/* Middle Section: Digital Delivery */}
            <div className={styles.confirmSection}>
              <span className={styles.sectionTag}>{t('digitalDeliveryTitle')}</span>
              <p className={styles.sectionBody}>{t('digitalDeliveryDesc')}</p>

              {/* Checkbox Consent */}
              <div 
                className={styles.consentRow}
                onClick={() => setAgreedToUpload(!agreedToUpload)}
              >
                <span className={`${styles.consentBracket} ${!agreedToUpload ? styles.unticked : ''}`}>
                  {agreedToUpload ? '[ ■ ]' : '[   ]'}
                </span>
                <span className={`${styles.consentText} ${!agreedToUpload ? styles.strikethrough : ''}`}>
                  {t('agreeUploadConsent')}
                </span>
              </div>
            </div>

            {/* Divider 2 */}
            <div className={styles.confirmDivider} />

            {/* Bottom Section: Retention Policy */}
            <div className={styles.confirmSection}>
              <span className={styles.sectionTag}>{t('retentionPolicyTitle')}</span>
              <p className={styles.sectionBody}>{t('retentionPolicyDesc')}</p>
            </div>

            {/* Divider 3 */}
            <div className={styles.confirmDivider} />

            {/* Actions Block */}
            <div className={styles.confirmActions}>
              <CtaButton
                onClick={handlePaymentSuccess}
                style={{ width: '100%' }}
              >
                {t('continueBtn')}
              </CtaButton>

              <SecondaryButton
                onClick={() => handleExit(onClose)}
                style={{ width: '100%' }}
              >
                {t('closeBtn')}
              </SecondaryButton>
            </div>
          </div>

          {/* Success Overlay (reused) */}
          <div
            ref={successOverlayRef}
            className={styles.successOverlay}
            style={{ pointerEvents: 'none' }}
          >
            <div className={styles.checkmark}>✓</div>
          </div>
        </div>
      </div>
    );
  }

  // --- TIMEOUT MODE (Fallback / Operator) ---
  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
      style={{ opacity: 0, pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div
        ref={modalRef}
        className={styles.modal}
        style={{ opacity: 0 }}
      >
        {/* Header (Editorial Hook) */}
        <h2 className={styles.header}>
          {mode === 'TIMEOUT' ? t('sessionTimingOut') : t('confirmPrintOrder')}
        </h2>

        {/* The Artifact QR Code / Message Box */}
        <div
          ref={qrRef}
          className="qr-box"
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}
        >
          <div className="vf-corner tl"></div>
          <div className="vf-corner tr"></div>
          <div className="vf-corner bl"></div>
          <div className="vf-corner br"></div>
          <div className="boundary-dashed-line-visual"></div>

          {mode === 'TIMEOUT' ? (
            <div className="timeout-countdown-display" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '5rem', fontWeight: 900, fontFamily: 'Neue Machina', color: '#ff4444', lineHeight: 1 }}>
                {timeoutCountdown}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '1rem', opacity: 0.7, letterSpacing: '0.2rem' }}>
                {t('secondsUntilExpiry')}
              </div>
            </div>
          ) : (
            <div className="confirm-display" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'Space Grotesk', marginBottom: '1rem' }}>
                {t('proceedWithPrinting')}
              </div>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, maxWidth: '240px', margin: '0 auto' }}>
                {t('printOrderConfirmDesc')}
              </p>
            </div>
          )}
        </div>

        {/* Expiry Indicator */}
        <div className={styles.expiry}>
          {mode === 'TIMEOUT' ? t('printNowPreventLoss') : t('additionalPrintsAdded')}
        </div>

        {/* Execute Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
          <PrimaryButton
            ref={primaryBtnRef}
            onClick={handlePaymentSuccess}
            style={{ width: '100%' }}
          >
            {mode === 'TIMEOUT' ? t('confirmPrintNow') : t('yesConfirmPrint')}
          </PrimaryButton>

          <SecondaryButton
            onClick={() => handleExit(onClose)}
            style={{ width: '100%' }}
          >
            {mode === 'TIMEOUT' ? t('cancelSession') : t('editOrder')}
          </SecondaryButton>
        </div>

        {/* Success Overlay (Checkmark) */}
        <div
          ref={successOverlayRef}
          className={styles.successOverlay}
          style={{ pointerEvents: 'none' }}
        >
          <div className={styles.checkmark}>✓</div>
        </div>
      </div>
    </div>
  );
};

export default GalleryCheckoutModal;
