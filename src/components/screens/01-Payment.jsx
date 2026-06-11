import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';
import SessionRecoveryModal from '../shared/SessionRecoveryModal';
import StatusService from '../../services/StatusService';
import { TRANSLATIONS } from '../../constants/translations';
import styles from './01-Payment.module.css';

const PaymentScreen = forwardRef(({ onBack, onSuccess, printCopies, setPrintCopies, timerDisplay, transactionTime, devMode = false, setIsTimerPaused, kioskId, devFreeFlow, onRestoreSession, selectedFrame, bypassMode = false, language = 'EN', setLanguage }, ref) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef();
  const leftPanelRef = useRef();
  const rightPanelRef = useRef();
  const odoDigitRef = useRef();

  // State
  const [coupon, setCoupon] = useState("");
  const [promoStatus, setPromoStatus] = useState("idle"); // idle, checking, success, failed
  const [price, setPrice] = useState(40000);
  const [originalPrice, setOriginalPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, success, failed
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  // Check for saved session on mount
  useEffect(() => {
    const rawSession = localStorage.getItem('photobooth_session');
    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        // Only show if it's not too old (e.g., last 30 minutes) and amountPaid > 0
        if (Date.now() - session.timestamp < 30 * 60 * 1000 && (session.amountPaid || 0) > 0) {
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
  useEffect(() => {

    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // Fade in the milky-mica-background
    tl.add(screenRef.current, {
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    }, 0);

    //fade in watermark, panel kiri, panel kanan
    entranceEditorialLayout(tl, { duration: 800 });

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  useEffect(() => {
    let rawPrice = 40000 + (printCopies - 1) * 20000;
    if (promoStatus === "success") {
      setOriginalPrice(rawPrice);
      setPrice(rawPrice * 0.8);
    } else {
      setPrice(rawPrice);
      setOriginalPrice(null);
    }
  }, [printCopies, promoStatus]);


  const handleConfirmCheckout = () => {
    setIsCheckoutModalOpen(true);
  };

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
    if (paymentStatus === "success") return;

    // 1. Pause the timer globally
    setIsTimerPaused(true);

    // 2. Set local success status
    setPaymentStatus("success");

    // 3. Delay before transitioning to next screen - TIGHT HANDSHAKE
    setTimeout(() => {
      const exitTl = createTimeline({
        onComplete: () => {
          setIsTimerPaused(false);
          onSuccess(price);
        }
      });

      // BUNDLE: Unified Editorial Exit
      exitEditorialLayout(exitTl, { duration: 400 });

    }, 2000); // 2 second celebration delay
  };

  const handlePaymentFailed = () => {
    setPaymentStatus("failed");
    // Status animation handled by useEffect below
  };

  const handlePaymentRetry = () => {
    setIsCheckoutModalOpen(true);
  };

  const [showNumpad, setShowNumpad] = useState(false);
  const numpadRef = useRef();


  // Animation for numpad appearance (Pushing Input Up)
  useEffect(() => {
    if (showNumpad && numpadRef.current) {
      animate(numpadRef.current, {
        height: [0, 'auto'],
        opacity: [0, 1],
        marginTop: [0, 16],
        duration: 400,
        easing: 'easeOutCubic'
      });
    }
  }, [showNumpad]);

  const handleNumpadPress = (val) => {
    if (promoStatus === "success") return;
    if (val === "DEL") {
      setCoupon(prev => prev.slice(0, -1));
    } else if (coupon.length < 8) {
      setCoupon(prev => prev + val);
    }
  };

  const validateCoupon = () => {
    if (!coupon) {
      setShowNumpad(false);
      return;
    }
    setPromoStatus("checking");

    // Simulate API call
    setTimeout(() => {
      if (coupon === "HYPE20") {
        setPromoStatus("success");
        setShowNumpad(false);
      } else {
        setPromoStatus("failed");
        setTimeout(() => setPromoStatus("idle"), 2000);
      }
    }, 1500);
  };

  const handleSetCopies = (val) => {
    if (val < 1 || val > 10) return;
    setPrintCopies(val);
  };

  // Punchy QTY Animation
  useEffect(() => {
    if (odoDigitRef.current) {
      animate(odoDigitRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutBack(1.7)'
      });
    }
  }, [printCopies]);

  const getRotation = (i) => {
    const seeds = [1.2, -0.8, 1.9, -1.5, 0.5, -1.2, 1.7, -0.3, 0.9, -1.8];
    return seeds[i % seeds.length];
  };

  return (
    <div
      ref={screenRef}
      className={`milky-mica-background ${isCheckoutModalOpen ? 'is-solid-mode' : ''} screen-container ${styles.screen}`}
      style={{
        zIndex: 10
      }}
    >
      {/* EDITORIAL TELEMETRY HUD */}
      <div className={styles.telemetryHud}>
        <div className={styles.telemetryRow}>
          <span className={styles.telemetryLabel}>{t('optics')}</span>
          <div className={styles.telemetryValueGroup}>
            <span className={styles.telemetryValue}>
              {StatusService.camera === 'ready' ? t('calibratedReady') : t('sensorMalfunction')}
            </span>
            <div className={`${styles.ledDot} ${StatusService.camera === 'ready' ? styles.ledHealthy : styles.ledWarning}`}></div>
          </div>
        </div>

        <div className={styles.telemetryRow}>
          <span className={styles.telemetryLabel}>{t('printMedia')}</span>
          <div className={styles.telemetryValueGroup}>
            <span className={styles.telemetryValue}>
              {StatusService.printer === 'ready' ? `85% ${t('capacity')}` : t('mediaDepleted')}
            </span>
            <div className={`${styles.ledDot} ${StatusService.printer === 'ready' ? styles.ledHealthy : styles.ledWarning}`}></div>
          </div>
        </div>
      </div>

      {/* PANEL KIRI: Kendali & Instruksi */}
      <div ref={leftPanelRef} className="panel-left">
        {/* The Giant Watermark */}
        <h2 className="watermark-sideways">{t('secureWatermark')}</h2>

        {/* Floating Language Switcher */}
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
        </div>

        <div style={{ width: '100%', marginTop: 'auto', marginBottom: 'auto', paddingBottom: '5rem', zIndex: 20 }}>
          {/* The Hero Overlap Title */}
          <div className="side-display-container">
            <div className="side-display-bullet">▌</div>
            <h2 className="side-display-h1">{t('paymentTitle')}</h2>
          </div>

          <div className={styles.instructionList}>

            <div className={styles.instructionStep}>
              <span className={styles.instructionNum}>01.</span>
              <p className={styles.instructionText}>{t('stepCopies')}</p>
            </div>
            <div className={styles.instructionStep}>
              <span className={styles.instructionNum}>02.</span>
              <p className={styles.instructionText}>
                {bypassMode ? t('stepPayStand') : t('stepConfirmQR')}
              </p>
            </div>

          </div>

          <div className={styles.promoContainer}>
            <span className={styles.promoLabel}>{t('promoLabel')}</span>
            <div
              className={`${styles.promoInput} ${promoStatus === 'checking' ? styles.statusChecking : ''} ${promoStatus === 'success' ? styles.statusSuccess : ''} ${promoStatus === 'failed' ? styles.statusFailed : ''} ${showNumpad ? styles.focused : ''}`}
              onClick={() => setShowNumpad(!showNumpad)}
            >
              {coupon || (showNumpad ? "" : <span style={{ color: "rgba(var(--theme-text-muted-rgb), 0.5)" }}>{t('promoPlaceholder')}</span>)}
              {showNumpad && <span className={styles.blinkingCursor}>|</span>}
            </div>
            {promoStatus === "checking" && <span className={`${styles.couponStatusMsg} ${styles.statusChecking}`}>{t('promoChecking')}</span>}
            {promoStatus === "success" && <span className={`${styles.couponStatusMsg} ${styles.statusSuccess}`}>{t('promoApplied')}</span>}
            {promoStatus === "failed" && <span className={`${styles.couponStatusMsg} ${styles.statusFailed}`}>{t('promoInvalid')}</span>}

            {promoStatus !== "success" && showNumpad && (
              <div ref={numpadRef} className={styles.numpad} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {["1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "D", "E", "F", "0", "DEL", "OK"].map(key => (
                  <button
                    key={key}
                    className={`${styles.numpadBtn} ${key === "OK" ? styles.actionOk : ""} ${key === "DEL" ? styles.actionDel : ""}`}
                    style={{ gridColumn: (key === "OK" || key === "DEL") ? 'span 2' : 'span 1' }}
                    onClick={() => {
                      if (key === "OK") validateCoupon();
                      else handleNumpadPress(key);
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PANEL KANAN: Transaksi */}
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
                <div className={styles.qtyEngineAxis}>
                  <button className={styles.qtyStepperBtn} onClick={() => handleSetCopies(printCopies + 1)}>+</button>
                  <div className={styles.qtyOdometerWindow}>
                    <div
                      className={styles.qtyOdometerTape}
                      style={{ transform: `translateY(${(1 - printCopies) * 100}px)` }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <div key={n} ref={printCopies === n ? odoDigitRef : null} className={styles.qtyOdometerDigit}>
                          {n.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className={styles.qtyStepperBtn} onClick={() => handleSetCopies(printCopies - 1)}>-</button>
                </div>

                <div className={styles.unoVisualAxis}>
                  <div className={styles.unoStackContainer}>
                    {Array.from({ length: printCopies }).map((_, index) => {
                      const mid = (printCopies - 1) / 2;
                      const targetX = (index - mid) * -10;
                      const targetY = (index - mid) * 10;
                      const targetRotate = getRotation(index);
                      return (
                        <div
                          key={index}
                          className={styles.unoCard}
                          style={{
                            zIndex: index,
                            transform: `translate(${targetX}px, ${targetY}px) rotate(${targetRotate}deg)`,
                            filter: `brightness(${100 - (printCopies - index - 1) * 1.1}%)`,
                          }}
                        >
                          <img src={selectedFrame?.thumbnail || "/assets/payment_qty.png"} alt={`Placeholder ${index + 1}`} />

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className={`btn-tier-1 ${styles.confirmBtn}`} onClick={handleConfirmCheckout} disabled={isLoading}>
            {isLoading ? t('pleaseWait') : (bypassMode ? t('payWithOperator') : t('generatePaymentQR'))}
          </button>
        </div>

        <div className={styles.priceDisplay} style={{ textAlign: 'center' }}>
          {originalPrice && <span className={styles.originalPrice} style={{ fontSize: '2rem' }}>Rp {originalPrice.toLocaleString()}</span>}
          <div className={styles.priceMonument}>Rp {price.toLocaleString()}</div>
        </div>

        {timerDisplay && (
          <div className={`timer-sleek pulse ${paymentStatus !== 'pending' ? 'paused' : ''}`} style={{ fontSize: '2rem', marginTop: '1rem' }}>
            {timerDisplay}
          </div>
        )}

        <div style={{
          marginTop: '3rem',
          fontFamily: 'Space Grotesk',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: "rgb(var(--theme-surface-dark-rgb))",
          textTransform: 'uppercase',
          letterSpacing: '0.1rem',
          textAlign: 'center',
          opacity: 0.4
        }}>
          SYSTEM ID: {kioskId} / TERMINAL: LIVE
        </div>

      </div>

      {/* DEV CONTROLS */}
      {devMode && (
        <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', gap: '0.5rem' }}>
          <button className="dev-btn" onClick={() => { setCoupon("HYPE20"); validateCoupon(); }}>[DEV] Promo Success</button>
          <button className="dev-btn" onClick={() => { setCoupon("WRONG"); validateCoupon(); }}>[DEV] Promo Fail</button>
          <button className="dev-btn" onClick={handlePaymentSuccess} style={{ color: 'var(--accent-color)' }}>[DEV] Pay Success</button>
          <button className="dev-btn" onClick={handlePaymentFailed} style={{ color: '#ff4444' }}>[DEV] Pay Fail</button>
          <button
            className="dev-btn"
            onClick={() => {
              console.log("Mock WebSocket: Paid!");
              handlePaymentSuccess();
            }}
          >
            [DEV] Websocket TEST-PAYMENT-SUCCESS
          </button>
        </div>
      )}

      {/* PAYMENT MODAL */}
      <GalleryCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onSuccess={handlePaymentSuccess}
        totalPrice={price}
        initialPayment={0}
        orderId={`PHB-${Math.floor(Date.now() / 1000)}`}
        timeLeft={transactionTime}
        devFreeFlow={devFreeFlow}
        setIsTimerPaused={setIsTimerPaused}
        mode="PAYMENT"
        bypassMode={bypassMode}
        language={language}
      />

      {/* RECOVERY MODAL */}
      <SessionRecoveryModal
        isOpen={showRecoveryModal}
        onContinue={handleContinueSession}
        onDiscard={handleDiscardSession}
        sessionData={savedSession || {}}
        language={language}
      />

    </div>
  );
});


export default PaymentScreen;
