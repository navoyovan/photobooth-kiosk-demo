import React, { useState, useEffect, useRef } from 'react';
import { animate, createTimeline } from 'animejs';
import styles from './GalleryCheckoutModal.module.css';

const GalleryCheckoutModal = ({ isOpen, onClose, onSuccess, totalPrice, initialPayment = 0, orderId = "ORD-9921", timeLeft, devFreeFlow, setIsTimerPaused }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success'
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef();
  const backdropRef = useRef();
  const qrRef = useRef();
  const primaryBtnRef = useRef();
  const successOverlayRef = useRef();

  const hasAnimatedIn = useRef(false);

  // Anime.js Entrance
  useEffect(() => {
    if (isOpen && !hasAnimatedIn.current) {
      hasAnimatedIn.current = true;
      const tl = createTimeline();

      // Backdrop entrance: Glassine blur & dark wash
      tl.add(backdropRef.current, {
        opacity: [0, 1],
        backdropFilter: ['blur(0px) brightness(1)', 'blur(20px) brightness(0.7)'],
        duration: 800,
        easing: 'easeOutQuad'
      });

      // Modal entrance: Physical depth & slide
      tl.add(modalRef.current, {
        translateY: [40, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: 700,
        easing: 'easeOutCubic'
      }, '-=400');

      // Primary button fade in smoothly
      if (primaryBtnRef.current) {
        tl.add(primaryBtnRef.current, {
          opacity: [0, 1],
          translateY: [10, 0],
          duration: 500,
          easing: 'easeOutQuad'
        }, '-=200');
      }

      return () => {
        if (tl) tl.pause();
      };
    }

    if (!isOpen) {
      hasAnimatedIn.current = false;
    }
  }, [isOpen]);

  // WebSocket logic (Laravel Reverb Mock)
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  const handleExit = (callback) => {
    const tl = createTimeline({ onComplete: callback });

    tl.add(modalRef.current, {
      translateY: 30,
      opacity: 0,
      duration: 500,
      easing: 'easeInCubic'
    }, 0);

    tl.add(backdropRef.current, {
      opacity: 0,
      duration: 600,
      easing: 'easeInOutQuad'
    }, 100);
  };

  const handlePaymentSuccess = () => {
    if (paymentStatus === 'success') return;

    // Pause timer immediately as soon as payment is accepted
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

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={styles.backdrop}
    >
      <div
        ref={modalRef}
        className={styles.modal}
      >
        {/* Header (Editorial Hook) */}
        <h2 className={styles.header}>
          ACQUISITION CERTIFICATE
        </h2>

        {/* The Artifact QR Code */}
        <div
          ref={qrRef}
          className="qr-box"
          style={{ position: 'relative' }}
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
          {isLoading ? (
            <div className="spinner-sleek animate-spin" style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0,0,0,0.1)',
              borderTopColor: '#111',
              borderRadius: '50%',
              margin: '80px auto'
            }}></div>
          ) : error ? (
            <div className="payment-error-state" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>⚠️</div>
              <span className="qr-placeholder-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: "#ff4444", letterSpacing: '0.1rem', fontFamily: 'Space Grotesk' }}>
                {error.toUpperCase()}
              </span>
            </div>
          ) : (
            <img
              src={qrData?.qr_url}
              alt="Artifact QR"
              className={styles.qrImage}
            />
          )}
        </div>

        {/* Summary (Minimalist & Clear) */}
        <div className={styles.summary}>
          <span className={styles.label}>
            ACQUISITION VALUE //
          </span>
          <span className={styles.value}>
            Rp {(qrData?.amount || (totalPrice - initialPayment)).toLocaleString()}
          </span>
        </div>

        {/* Expiry Indicator */}
        <div className={styles.expiry}>
          QR VALID UNTIL [ {formatTime(timeLeft)} ]
        </div>

        {/* Execute Block (Now for Cancel) */}
        <button
          ref={primaryBtnRef}
          className="btn-secondary"
          onClick={() => handleExit(onClose)}
          style={{ marginTop: 'auto' }}
        >
          ← CANCEL & EDIT ORDER
        </button>

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
