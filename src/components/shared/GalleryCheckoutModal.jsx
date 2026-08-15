import React, { useState, useEffect, useRef } from 'react';
import { animate, createTimeline } from 'animejs';
import styles from './GalleryCheckoutModal.module.css';
import { getBackendUrl } from '../../utils/kioskId';
import { TRANSLATIONS } from '../../constants/translations';
import { SecondaryButton, PrimaryButton } from '../../ui';

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

  // WebSocket logic (Laravel Reverb Mock)
  useEffect(() => {
    if (!isOpen || mode !== 'PAYMENT') return;

    if (bypassMode) {
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
        console.error('Fetch error:', err);
        setError('Hardware Network Error');
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
      onComplete: onSuccess
    }, '-=500');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!active) return null;

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
          {mode === 'PAYMENT' 
            ? (bypassMode ? t('operatorAuthRequired') : t('acquisitionCertificate')) 
            : mode === 'TIMEOUT' ? t('sessionTimingOut') : t('confirmPrintOrder')}
        </h2>

        {/* The Artifact QR Code / Message Box */}
        <div
          ref={qrRef}
          className="qr-box"
          style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}
          onClick={(e) => {
            if (devFreeFlow && e.detail === 2) {
              console.log("[DevFreeFlow] Double-tap QR skip triggered.");
              handlePaymentSuccess();
            }
          }}
        >
          <div className="vf-corner tl"></div>
          <div className="vf-corner tr"></div>
          <div className="vf-corner bl"></div>
          <div className="vf-corner br"></div>
          <div className="boundary-dashed-line-visual"></div>

          {mode === 'PAYMENT' ? (
            bypassMode ? (
              <div className="bypass-operator-display" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.8rem', animation: 'pulse 1.5s infinite' }}>🛎️</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'Space Grotesk', color: '#ffaa00', letterSpacing: '0.05rem', marginBottom: '0.4rem' }}>
                  {t('manualPaymentBypass')}
                </div>
                <p style={{ fontSize: '0.8rem', opacity: 0.7, maxWidth: '280px', margin: '0 auto', lineHeight: '1.4', color: '#111' }}>
                  {t('pleasePayOperator').replace('{amount}', (totalPrice - initialPayment).toLocaleString())}
                </p>
                <div style={{ fontSize: '0.65rem', color: '#ffaa00', fontWeight: 700, marginTop: '0.8rem', letterSpacing: '0.1rem' }}>
                  {t('operatorAccessRequired')}
                </div>
              </div>
            ) : isLoading ? (
              <div className="spinner-sleek animate-spin" style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(0,0,0,0.1)',
                borderTopColor: '#111',
                borderRadius: '50%',
                margin: 'auto'
              }}></div>
            ) : error ? (
              <div className="payment-error-state" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>⚠️</div>
                <span className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "#ff4444", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                  {t('hardwareNetworkError').toUpperCase()}
                </span>
              </div>
            ) : (
              <img
                src={qrData?.qr_url}
                alt="Artifact QR"
                className={styles.qrImage}
              />
            )
          ) : mode === 'TIMEOUT' ? (
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

        {/* Summary (Minimalist & Clear) */}
        {(totalPrice - initialPayment > 0) && (
          <div className={styles.summary}>
            <span className={styles.label}>
              {t('acquisitionValue')}
            </span>
            <span className={styles.value}>
              Rp {(qrData?.amount || (totalPrice - initialPayment)).toLocaleString()}
            </span>
          </div>
        )}

        {/* Expiry Indicator */}
        <div className={styles.expiry}>
          {mode === 'PAYMENT' ? (bypassMode ? t('verifyCustomerPayment') : t('qrValidUntil').replace('{time}', formatTime(timeLeft))) :
            mode === 'TIMEOUT' ? t('printNowPreventLoss') :
              t('additionalPrintsAdded')}
        </div>

        {/* Execute Block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: 'auto' }}>
          {(mode !== 'PAYMENT' || bypassMode) && (
            <PrimaryButton
              ref={primaryBtnRef}
              onClick={handlePaymentSuccess}
              style={{
                width: '100%',
                ...(bypassMode && mode === 'PAYMENT' ? { background: '#ffaa00', color: '#000000' } : {})
              }}
            >
              {mode === 'TIMEOUT' ? t('confirmPrintNow') :
               mode === 'PAYMENT' ? (initialPayment === 0 ? t('authorizeStartSession') : t('authorizePrint')) :
               t('yesConfirmPrint')}
            </PrimaryButton>
          )}

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
