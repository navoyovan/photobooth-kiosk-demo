import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const PaymentScreen = forwardRef(({ onBack, onSuccess, printCopies, setPrintCopies, timerDisplay, devMode = false, setIsTimerPaused, kioskId }, ref) => {
  const screenRef = useRef();
  const leftPanelRef = useRef();
  const rightPanelRef = useRef();
  const [coupon, setCoupon] = useState("");
  const [promoStatus, setPromoStatus] = useState("idle"); // idle, checking, success, failed
  const [price, setPrice] = useState(40000);
  const [originalPrice, setOriginalPrice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, success, failed
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const UNIT_PRICE = 20000;

  useGSAP(() => {
    const tl = gsap.timeline();

    // Fade in the milky-mica-background
    tl.from(screenRef.current, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.out"
    }, 0);

    // Parallax Slide-in from Right to Left - HALVED DURATIONS
    // Giant Watermark (Deepest parallax)
    tl.from(".watermark-sideways", {
      x: 300,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out"
    }, 0.05);

    // Left Panel UI Elements
    tl.from(leftPanelRef.current, {
      x: 150,
      opacity: 0,
      duration: 0.65,
      ease: "power3.out"
    }, 0.15);

    // Right Panel (QR & Price)
    tl.from(rightPanelRef.current, {
      x: 100,
      opacity: 0,
      duration: 0.75,
      ease: "power3.out"
    }, 0.2);

  }, { scope: screenRef });

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

  useEffect(() => {
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
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Hardware Network Error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQr();
  }, []);

  const handleCancel = () => {
    gsap.to(screenRef.current, {
      opacity: 0,
      y: 40,
      duration: 0.6,
      ease: "power3.in",
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

    // 3. Animate the success feedback
    gsap.fromTo(".payment-status-overlay.success",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );

    // 4. Delay before transitioning to next screen - TIGHT HANDSHAKE
    setTimeout(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          setIsTimerPaused(false);
          onSuccess();
        }
      });

      // Elements slide out left
      exitTl.to([leftPanelRef.current, rightPanelRef.current], {
        x: -100,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        stagger: 0.1
      });

      // Watermark deeper parallax exit
      exitTl.to(".watermark-sideways", {
        x: -200,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in"
      }, 0);

      // // Flash to white
      // exitTl.to(".page-exit-white-overlay", {
      //   opacity: 1,
      //   duration: 0.3,
      //   ease: "power1.in"
      // }, "-=0.2");

    }, 2000); // 2 second celebration delay
  };

  const handlePaymentFailed = () => {
    setPaymentStatus("failed");
    gsap.fromTo(".payment-status-overlay.failed",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
    );
  };

  const handlePaymentRetry = () => {
    setPaymentStatus("pending");
    // Animation for returning to QR state
    gsap.fromTo(".qr-placeholder-text", { opacity: 0 }, { opacity: 1, duration: 0.5 });
  };

  const [showNumpad, setShowNumpad] = useState(false);
  const numpadRef = useRef();

  // Animation for numpad appearance (Pushing Input Up)
  useEffect(() => {
    if (showNumpad && numpadRef.current) {
      gsap.fromTo(numpadRef.current,
        { height: 0, opacity: 0, marginTop: 0 },
        { height: 'auto', opacity: 1, marginTop: 16, duration: 0.4, ease: "power3.out" }
      );
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

  return (
    <div
      ref={screenRef}
      className="milky-mica-background screen-container payment-screen"
      style={{
        zIndex: 10
      }}
    >
      {/* EXIT OVERLAY */}
      {/* <div className="page-exit-white-overlay" style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'white',
        opacity: 0,
        zIndex: 10000,
        pointerEvents: 'none'
      }}></div> */}

      {/* PAGE ENTRANCE OVERLAY - Removed to prevent white flash */}


      {/* PANEL KIRI: Kendali & Instruksi */}
      <div ref={leftPanelRef} className="panel-left">
        {/* The Giant Watermark */}
        <h2 className="watermark-sideways">SECURE</h2>

        <div style={{ width: '100%', marginTop: 'auto', marginBottom: 'auto', zIndex: 20 }}>
          {/* The Hero Overlap Title */}
          <div className="hero-h1-container">
            <div className="hero-bullet">▌</div>
            <h2 className="hero-h1">PAYMENT</h2>
          </div>

          <div className="instruction-list">
            <div className="instruction-step">
              <span className="instruction-num">01.</span>
              <p className="instruction-text">SCAN QR CODE USING YOUR E-WALLET APP.</p>
            </div>
            <div className="instruction-step">
              <span className="instruction-num">02.</span>
              <p className="instruction-text">CONFIRM THE NOMINAL ON YOUR DEVICE.</p>
            </div>
            <div className="instruction-step">
              <span className="instruction-num">03.</span>
              <p className="instruction-text">WAIT FOR SYSTEM TO VERIFY (DO NOT CLOSE).</p>
            </div>
          </div>

          <div className="promo-container">
            <span className="promo-label">HAVE A PROMO CODE?</span>
            <div
              className={`promo-input-clean ${promoStatus} ${showNumpad ? 'focused' : ''}`}
              onClick={() => setShowNumpad(!showNumpad)}
            >
              {coupon || (showNumpad ? "" : <span style={{ color: "rgba(var(--theme-text-muted-rgb), 0.5)" }}>TAP TO ENTER CODE</span>)}
              {showNumpad && <span className="blinking-cursor">|</span>}
            </div>
            {promoStatus === "checking" && <span className="coupon-status-msg status-checking">VERIFYING...</span>}
            {promoStatus === "success" && <span className="coupon-status-msg status-success">CODE APPLIED</span>}
            {promoStatus === "failed" && <span className="coupon-status-msg status-failed">INVALID CODE</span>}

            {promoStatus !== "success" && showNumpad && (
              <div ref={numpadRef} className="numpad-editorial">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "DEL", "0", "OK"].map(key => (
                  <button
                    key={key}
                    className={`numpad-btn-clean ${key === "OK" ? "action-ok" : ""} ${key === "DEL" ? "action-del" : ""}`}
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg"
              alt="QRIS Logo"
              style={{ width: '160px', height: 'auto', opacity: 0.9 }}
            />
          </div>

          <div style={{
            width: '450px',
            height: '450px',
            background: 'transparent',
            border: '2px dashed #999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {isLoading && (
              <div className="payment-loading-state" style={{ textAlign: 'center' }}>
                <div className="spinner-sleek animate-spin" style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(0,0,0,0.1)',
                  borderTopColor: '#111',
                  borderRadius: '50%',
                  margin: '0 auto 1.5rem'
                }}></div>
                <span className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "rgba(0,0,0,0.4)", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                  GENERATING QR CODE...
                </span>
              </div>
            )}

            {!isLoading && error && (
              <div className="payment-error-state" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>⚠️</div>
                <span className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "#ff4444", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                  {error.toUpperCase()}
                </span>
              </div>
            )}

            {!isLoading && !error && qrData && paymentStatus === "pending" && (
              <img
                src={qrData.qr_url}
                alt="QRIS Payment"
                style={{ width: '350px', height: '350px', objectFit: 'contain' }}
              />
            )}

            {paymentStatus === "success" && (
              <div className="payment-status-overlay success">
                <div className="status-icon">✓</div>
                <div className="status-text">PAYMENT VERIFIED</div>
                <div className="status-sub">PREPARING YOUR SESSION</div>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="payment-status-overlay failed">
                <div className="status-icon">✕</div>
                <div className="status-text">TRANSACTION FAILED</div>
                <button className="btn-retry-payment" onClick={handlePaymentRetry}>RETRY TRANSACTION</button>
              </div>
            )}

            {/* Decorative corners */}
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '32px', height: '32px', borderTop: '6px solid #111', borderLeft: '6px solid #111' }}></div>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '32px', height: '32px', borderTop: '6px solid #111', borderRight: '6px solid #111' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '32px', height: '32px', borderBottom: '6px solid #111', borderLeft: '6px solid #111' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '32px', height: '32px', borderBottom: '6px solid #111', borderRight: '6px solid #111' }}></div>
          </div>

          <div className="payment-price-display" style={{ marginTop: '3rem', textAlign: 'center' }}>
            {originalPrice && <span className="original-price" style={{ fontSize: '2rem' }}>Rp {originalPrice.toLocaleString()}</span>}
            <div className="price-monument" style={{ fontSize: '6rem', marginTop: '0' }}>Rp {price.toLocaleString()}</div>
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
          // style={{
          //   position: 'fixed',
          //   bottom: '0',
          //   left: '0',
          //   width: '40px',
          //   height: '40px',
          //   opacity: 1,
          //   cursor: 'default',
          //   zIndex: 9999
          // }}
          >
            [DEV] Websocket TEST-PAYMENT-SUCCESS
          </button>
        </div>
      )}

    </div>
  );
});

export default PaymentScreen;
