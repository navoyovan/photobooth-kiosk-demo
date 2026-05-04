import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { animate, createTimeline, stagger } from 'animejs';
import { exitEditorialLayout } from '../../utils/transitions';
import { entranceEditorialLayout } from '../../utils/transitions';
import styles from './01-Payment.module.css';

const PaymentScreen = forwardRef(({ onBack, onSuccess, printCopies, setPrintCopies, timerDisplay, devMode = false, setIsTimerPaused, kioskId, devFreeFlow }, ref) => {
  const screenRef = useRef();
  const leftPanelRef = useRef();
  const rightPanelRef = useRef();
  const successOverlayRef = useRef();
  const failedOverlayRef = useRef();
  const qrPlaceholderRef = useRef();
  const odoDigitRef = useRef();

  // State
  const [paymentPhase, setPaymentPhase] = useState('checkout'); // 'checkout', 'payment'
  const [coupon, setCoupon] = useState("");
  const [promoStatus, setPromoStatus] = useState("idle"); // idle, checking, success, failed
  const [price, setPrice] = useState(40000);
  const [originalPrice, setOriginalPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, success, failed

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

  const fetchQr = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/qris/mock-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          "kiosk_id": "HYPEBOX-DEV-01",
          "package_id": "premium_grid"
        })
      });

      if (!response.ok) {
        throw new Error('Hardware Network Error');
      }

      const data = await response.json();
      setQrData(data);
      setPaymentPhase('payment');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Hardware Network Error');
      setPaymentPhase('payment'); // Go to payment phase to show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCheckout = () => {
    fetchQr();
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
    setPaymentStatus("pending");
    fetchQr();
  };

  const [showNumpad, setShowNumpad] = useState(false);
  const numpadRef = useRef();

  // Status Animations
  useEffect(() => {
    if (paymentStatus === "success" && successOverlayRef.current) {
      animate(successOverlayRef.current, {
        scale: [0.8, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutBack(1.7)'
      });
    } else if (paymentStatus === "failed" && failedOverlayRef.current) {
      animate(failedOverlayRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
  }, [paymentStatus]);

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
      className={`milky-mica-background screen-container ${styles.screen}`}
      style={{
        zIndex: 10
      }}
    >

      {/* PANEL KIRI: Kendali & Instruksi */}
      <div ref={leftPanelRef} className="panel-left">
        {/* The Giant Watermark */}
        <h2 className="watermark-sideways">SECURE</h2>

        <div style={{ width: '100%', marginTop: 'auto', marginBottom: 'auto', zIndex: 20 }}>
          {/* The Hero Overlap Title */}
          <div className="side-display-container">
            <div className="side-display-bullet">▌</div>
            <h2 className="side-display-h1">PAYMENT</h2>
          </div>

          <div className={styles.instructionList}>
            {paymentPhase === 'checkout' ? (
              <>
                <div className={styles.instructionStep}>
                  <span className={styles.instructionNum}>01.</span>
                  <p className={styles.instructionText}>CHOOSE HOW MANY COPIES YOU NEED.</p>
                </div>
                <div className={styles.instructionStep}>
                  <span className={styles.instructionNum}>02.</span>
                  <p className={styles.instructionText}>CONFIRM THE SELECTION TO GENERATE QR.</p>
                </div>
              </>
            ) : (
              <>
                <div className={styles.instructionStep}>
                  <span className={styles.instructionNum}>01.</span>
                  <p className={styles.instructionText}>SCAN QR CODE USING YOUR E-WALLET APP.</p>
                </div>
                <div className={styles.instructionStep}>
                  <span className={styles.instructionNum}>02.</span>
                  <p className={styles.instructionText}>CONFIRM THE NOMINAL ON YOUR DEVICE.</p>
                </div>
                <div className={styles.instructionStep}>
                  <span className={styles.instructionNum}>03.</span>
                  <p className={styles.instructionText}>WAIT FOR SYSTEM TO VERIFY (DO NOT CLOSE).</p>
                </div>
              </>
            )}
          </div>

          <div className={styles.promoContainer}>
            <span className={styles.promoLabel}>HAVE A PROMO CODE?</span>
            <div
              className={`${styles.promoInput} ${promoStatus === 'checking' ? styles.statusChecking : ''} ${promoStatus === 'success' ? styles.statusSuccess : ''} ${promoStatus === 'failed' ? styles.statusFailed : ''} ${showNumpad ? styles.focused : ''}`}
              onClick={() => setShowNumpad(!showNumpad)}
            >
              {coupon || (showNumpad ? "" : <span style={{ color: "rgba(var(--theme-text-muted-rgb), 0.5)" }}>TAP TO ENTER CODE</span>)}
              {showNumpad && <span className={styles.blinkingCursor}>|</span>}
            </div>
            {promoStatus === "checking" && <span className={`${styles.couponStatusMsg} ${styles.statusChecking}`}>VERIFYING...</span>}
            {promoStatus === "success" && <span className={`${styles.couponStatusMsg} ${styles.statusSuccess}`}>CODE APPLIED</span>}
            {promoStatus === "failed" && <span className={`${styles.couponStatusMsg} ${styles.statusFailed}`}>INVALID CODE</span>}

            {promoStatus !== "success" && showNumpad && (
              <div ref={numpadRef} className={styles.numpad}>
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "OK"].map(key => (
                  <button
                    key={key}
                    className={`${styles.numpadBtn} ${key === "OK" ? styles.actionOk : ""} ${key === "DEL" ? styles.actionDel : ""}`}
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

          {/* INTERCHANGEABLE CONTENT */}
          <div className={`${styles.phaseWrapper} ${styles.fadePhase}`} key={paymentPhase}>
            {paymentPhase === 'checkout' ? (
              <div className={styles.checkoutBody}>

                <div className={styles.qtyEngineAxis} style={{ marginRight: '5rem' }}>
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
                          <img src="/taken_pic/default.png" alt={`Placeholder ${index + 1}`} />
                          <div className="boundary-dashed-line-visual"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>


              </div>
            ) : (
              <div className={styles.paymentPhase}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg"
                    alt="QRIS Logo"
                    style={{ width: '160px', height: 'auto', opacity: 0.9 }}
                  />
                </div>

                <div
                  className="qr-scanner-monument"
                  style={{
                    width: '450px',
                    height: '450px',
                    background: '#FFFFFF',
                    position: 'relative'
                  }}
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

                  {isLoading && (
                    <div className="payment-loading-state" style={{ textAlign: 'center', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner-sleek animate-spin" style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(0,0,0,0.1)',
                        borderTopColor: '#111',
                        borderRadius: '50%',
                        margin: '0 auto 1.5rem'
                      }}></div>
                      <span ref={qrPlaceholderRef} className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "rgba(0,0,0,0.4)", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                        GENERATING QR CODE...
                      </span>
                    </div>
                  )}

                  {!isLoading && error && (
                    <div className="payment-error-state" style={{ textAlign: 'center', padding: '2rem', position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>⚠️</div>
                      <span ref={qrPlaceholderRef} className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "#ff4444", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                        {error.toUpperCase()}
                      </span>
                      <button className={styles.retryButton} onClick={handlePaymentRetry} style={{ marginTop: '1rem' }}>RETRY</button>
                    </div>
                  )}

                  {!isLoading && !error && qrData && paymentStatus === "pending" && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={qrData.qr_url}
                        alt="QRIS Payment"
                        style={{ width: '350px', height: '350px', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  {paymentStatus === "success" && (
                    <div ref={successOverlayRef} className={`${styles.statusOverlay} ${styles.success}`}>
                      <div className={styles.statusIcon}>✓</div>
                      <div className={styles.statusText}>PAYMENT VERIFIED</div>
                      <div className={styles.statusSub}>PREPARING YOUR SESSION</div>
                    </div>
                  )}

                  {paymentStatus === "failed" && (
                    <div ref={failedOverlayRef} className={`${styles.statusOverlay} ${styles.failed}`}>
                      <div className={styles.statusIcon}>✕</div>
                      <div className={styles.statusText}>TRANSACTION FAILED</div>
                      <button className={styles.retryButton} onClick={handlePaymentRetry}>RETRY TRANSACTION</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {paymentPhase === 'checkout' && (
            <button className={`btn-tier-1 ${styles.confirmBtn}`} onClick={handleConfirmCheckout} disabled={isLoading}>
              {isLoading ? "BNTAR YH.." : "NEXT"}
            </button>
          )}

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

    </div>
  );
});


export default PaymentScreen;
