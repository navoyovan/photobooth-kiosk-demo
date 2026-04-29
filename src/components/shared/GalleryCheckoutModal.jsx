import React, { useState, useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const GalleryCheckoutModal = ({ isOpen, onClose, onSuccess, totalPrice, orderId = "ORD-9921" }) => {
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success'
  const [timeLeft, setTimeLeft] = useState(299); // 04:59
  const modalRef = useRef();
  const backdropRef = useRef();
  const qrRef = useRef();
  const primaryBtnRef = useRef();
  const successOverlayRef = useRef();

  // GSAP Entrance
  useGSAP(() => {
    if (isOpen) {
      const tl = gsap.timeline();
      
      // Backdrop entrance: Glassine blur & dark wash
      tl.fromTo(backdropRef.current, 
        { opacity: 0, backdropFilter: 'blur(0px) brightness(1)' },
        { opacity: 1, backdropFilter: 'blur(20px) brightness(0.7)', duration: 0.8, ease: 'power2.out' }
      );
      
      // Modal entrance: Physical depth & slide
      tl.fromTo(modalRef.current,
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' },
        "-=0.4"
      );

      // Primary button fade in smoothly
      tl.fromTo(primaryBtnRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        "-=0.2"
      );
    }
  }, [isOpen]);

  // Timer logic
  useEffect(() => {
    if (!isOpen || paymentStatus !== 'pending') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paymentStatus]);

  // WebSocket logic (Laravel Reverb)
  useEffect(() => {
    if (!isOpen || paymentStatus !== 'pending') return;
    
    console.log(`[WS] Listening to Laravel Reverb for Order: ${orderId}`);
    
    // DEV MODE: Allow manual success for testing
    window.simulatePaymentSuccess = () => handlePaymentSuccess();

    return () => {
      delete window.simulatePaymentSuccess;
    };
  }, [isOpen, paymentStatus, orderId]);

  const handleExit = (callback) => {
    const tl = gsap.timeline({ onComplete: callback });
    
    tl.to(modalRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.in'
    }, 0);
    
    tl.to(backdropRef.current, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut'
    }, 0.1);
  };

  const handlePaymentSuccess = () => {
    if (paymentStatus === 'success') return;

    // Trigger Cyan Flash on click/success
    const flashTl = gsap.timeline();
    flashTl.to(primaryBtnRef.current, { backgroundColor: '#00FFFF', duration: 0.05 })
           .to(primaryBtnRef.current, { backgroundColor: '#000000', duration: 0.1 });

    // Transition Logic
    setTimeout(() => {
      setPaymentStatus('success');

      const tl = gsap.timeline();
      
      // 1. QR artifact gently fades out
      tl.to(qrRef.current, { 
        opacity: 0, 
        scale: 0.95, 
        duration: 0.6, 
        ease: 'power2.inOut' 
      });
      
      // 2. Simple checkmark fades in
      tl.fromTo(successOverlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: 'power2.out' },
        "-=0.3"
      );

      // 3. Modal dissolves and glide to Archive
      tl.to(modalRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.8,
        ease: 'power3.inOut'
      }, "+=1.0");

      tl.to(backdropRef.current, {
        opacity: 0,
        duration: 0.8,
        onComplete: onSuccess
      }, "-=0.5");

    }, 150);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isOpen) return null;

  // Generate dynamic QRIS link
  const qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=REVERB_PAYMENT_${orderId}_${totalPrice}`;

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
        >
          <img 
            src={qrisUrl} 
            alt="Artifact QR" 
            className="acquisition-qr-image"
          />
        </div>

        {/* Summary (Minimalist & Clear) */}
        <div className="acquisition-summary">
          <span className="acquisition-label">Acquisition Value //</span>
          <span className="acquisition-value">Rp {totalPrice.toLocaleString()}</span>
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
