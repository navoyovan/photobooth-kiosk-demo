import React, { useState, useEffect, useRef } from 'react';
import { animate, createTimeline } from 'animejs';

const GalleryCheckoutModal = ({ isOpen, onClose, onSuccess, totalPrice, initialPayment = 0, orderId = "ORD-9921", timeLeft, devFreeFlow }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success'
  const [qrData, setQrData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef();
  const backdropRef = useRef();
  const qrRef = useRef();
  const primaryBtnRef = useRef();
  const successOverlayRef = useRef();

  // Anime.js Entrance
  useEffect(() => {
    if (isOpen) {
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
      tl.add(primaryBtnRef.current, {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 500,
        easing: 'easeOutQuad'
      }, '-=200');
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

    // Trigger Cyan Flash on click/success
    animate(primaryBtnRef.current, {
      backgroundColor: ['#00FFFF', '#000000'],
      duration: 150,
      easing: 'linear'
    });

    // Transition Logic
    setTimeout(() => {
      setPaymentStatus('success');

      const tl = createTimeline();

      // 1. QR artifact gently fades out
      tl.add(qrRef.current, {
        opacity: 0,
        scale: 0.95,
        duration: 600,
        easing: 'easeInOutQuad'
      });

      // 2. Simple checkmark fades in
      tl.add(successOverlayRef.current, {
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
      }, '-=300');

      // 3. Modal dissolves and glide to Archive
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

    }, 150);
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
      className="acquisition-modal-backdrop"
    >
      <div
        ref={modalRef}
        className="acquisition-certificate-card"
      >
        {/* Header (Editorial Hook) */}
        <h2 className="acquisition-header">
          ACQUISITION CERTIFICATE
        </h2>

        {/* The Artifact QR Code */}
        <div
          ref={qrRef}
          className="acquisition-qr-container"
          style={{ position: 'relative' }}
          onClick={(e) => {
            if (devFreeFlow && e.detail === 2) {
              console.log("[DevFreeFlow] Double-tap QR skip triggered.");
              handlePaymentSuccess();
            }
          }}
        >
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
              className="acquisition-qr-image"
            />
          )}
        </div>

        {/* Summary (Minimalist & Clear) */}
        <div className="acquisition-summary">
          <span className="acquisition-label">
            {qrData?.order_id || "GENERATING ID..."} //
          </span>
          <span className="acquisition-value">
            Rp {(qrData?.amount || (totalPrice - initialPayment)).toLocaleString()}
          </span>
        </div>

        {/* Expiry Indicator */}
        <div className="acquisition-expiry">
          QR VALID UNTIL [ {formatTime(timeLeft)} ]
        </div>

        {/* Execute Block (Now for Cancel) */}
        <button
          className="btn-acquisition-secondary"
          onClick={() => handleExit(onClose)}
        >
          ← CANCEL & EDIT ORDER
        </button>

        {/* Success Overlay (Checkmark) */}
        {paymentStatus === 'success' && (
          <div ref={successOverlayRef} className="acquisition-success-overlay">
            <div className="acquisition-checkmark">✓</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryCheckoutModal;
