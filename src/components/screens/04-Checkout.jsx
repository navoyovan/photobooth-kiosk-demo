import React, { useState, useRef, useEffect } from 'react';
import { animate, createTimeline, stagger, remove } from 'animejs';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';

const PrintManifestScreen = ({ finalImage, printCopies, setPrintCopies, isCheckoutOpen, setIsCheckoutOpen, transactionTime, amountPaid, onNext, devFreeFlow }) => {
  const screenRef = useRef();
  const stackContainerRef = useRef();
  const audioRef = useRef();
  const odoDigitRef = useRef();

  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    // 1. Master Entrance
    tl.add('.ghost-watermark', {
      translateX: ['-35%', '-50%'],
      translateY: ['-50%', '-50%'],
      opacity: [0, 1],
      duration: 1400,
      easing: 'easeOutQuart'
    }, 50);

    tl.add('.qty-engine-axis', {
      translateX: [150, 0],
      translateY: ['-50%', '-50%'],
      opacity: [0, 1],
      duration: 650,
      easing: 'easeOutCubic'
    }, 150);

    // Subtle entrance that settles at 5vw rightward offset
    tl.add('.uno-visual-axis', {
      translateX: ['8vw', '5vw'],
      opacity: [0, 1],
      duration: 750,
      easing: 'easeOutCubic'
    }, 100);

    tl.add('.telemetry-right-axis', {
      translateX: [100, 0],
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuad'
    }, 200);

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  // Punchy QTY Animation
  useEffect(() => {
    if (odoDigitRef.current) {
      animate(odoDigitRef.current, {
        scale: [0.5, 1],
        opacity: [0, 1],
        filter: ['blur(10px)', 'blur(0px)'],
        duration: 400,
        easing: 'easeOutBack(1.7)'
      });
    }
  }, [printCopies]);

  // THE COMPRESSION: Stack reaction when quantity increases
  const lastCount = useRef(printCopies);
  useEffect(() => {
    if (printCopies > lastCount.current && stackContainerRef.current) {
      animate(stackContainerRef.current, {
        scale: [0.99, 1],
        translateY: [5, 0],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
    lastCount.current = printCopies;
  }, [printCopies]);

  const handleSetCopies = (val) => {
    if (val < 1 || val > 10) return;
    setPrintCopies(val);
  };

  const totalPrice = 40000 + (printCopies - 1) * 20000;

  const getRotation = (i) => {
    const seeds = [1.2, -0.8, 1.9, -1.5, 0.5, -1.2, 1.7, -0.3, 0.9, -1.8];
    return seeds[i % seeds.length];
  };

  const handleCheckoutSuccess = () => {
    // Kill the infinite float smoothly by adding the CSS class
    const floater = screenRef.current.querySelector('.uno-visual-float');
    if (floater) floater.classList.add('no-float');

    const tl = createTimeline({
      onComplete: onNext
    });

    // 1. Smoothly return Y to 0 while snapping X back to center
    if (screenRef.current.querySelector(".uno-visual-anchor")) {
      tl.add('.uno-visual-anchor', {
        translateY: 0,
        duration: 1000,
        easing: 'easeInOutQuad'
      }, 0);
    }

    if (screenRef.current.querySelector(".uno-visual-axis")) {
      tl.add('.uno-visual-axis', {
        translateX: 0,
        opacity: 1, // Keep it visible during transition
        duration: 1000,
        easing: 'easeInOutQuart'
      }, 0);
    }

    // Collapse stack
    const cards = screenRef.current.querySelectorAll(".uno-card");
    if (cards.length > 0) {
      tl.add(cards, {
        translateX: 0,
        translateY: 0,
        rotate: 0,
        duration: 800,
        easing: 'easeInOutCubic'
      }, 0);

      // Fade out background cards to prevent shadow stacking artifacts
      const backgroundCards = screenRef.current.querySelectorAll(".uno-card:not(:last-child)");
      if (backgroundCards.length > 0) {
        tl.add(backgroundCards, {
          opacity: 0,
          duration: 600,
          easing: 'easeInQuad'
        }, 100);
      }
    }

    // 2. Parallax out the checkout-specific UI
    const uiElements = [".manifest-right-panel", ".qty-engine-axis", ".ghost-watermark"].filter(sel =>
      screenRef.current.querySelector(sel)
    );
    if (uiElements.length > 0) {
      tl.add(uiElements, {
        opacity: 0,
        translateX: -100,
        duration: 600,
        easing: 'easeInQuad',
        delay: stagger(50)
      }, 0);
    }
  };

  // Guard against non-number printCopies
  const safeCopies = Number(printCopies) || 1;

  return (
    <div ref={screenRef} className="darkroom-pedestal editorial-shared-layout">

      {/* 0. GHOST WATERMARK */}
      <div className="ghost-watermark">DARK<br />ROOM</div>

      {/* 3. LEFT AXIS: THE VERTICAL QTY ENGINE */}
      <div className="qty-engine-axis">
        <button className="qty-stepper-btn" onClick={() => handleSetCopies(safeCopies + 1)}>+</button>
        <div className="qty-odometer-window">
          <div
            className="qty-odometer-tape"
            style={{ transform: `translateY(${(1 - safeCopies) * 8.5}rem)` }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <div key={n} ref={safeCopies === n ? odoDigitRef : null} className="qty-odometer-digit">
                {n.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        <button className="qty-stepper-btn" onClick={() => handleSetCopies(safeCopies - 1)}>-</button>
      </div>

      <div className="masterpiece-left-axis">
        <div className="uno-visual-axis">
          <div className="uno-visual-float">
            <div className="uno-visual-anchor">
              <div ref={stackContainerRef} className="uno-stack-container">
                {Array.from({ length: safeCopies }).map((_, index) => {
                  const mid = (safeCopies - 1) / 2;
                  const targetX = (index - mid) * -15;
                  const targetY = (index - mid) * 15;
                  const targetRotate = getRotation(index);
                  return (
                    <div
                      key={index}
                      className="uno-card"
                      style={{
                        zIndex: index,
                        transform: `translate(${targetX}px, ${targetY}px) rotate(${targetRotate}deg)`,
                        filter: `brightness(${100 - (safeCopies - index - 1) * 4}%)`,
                      }}
                    >
                      <img src={finalImage || "/taken_pic/default.png"} alt={`Manifest ${index + 1}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHARED TELEMETRY AXIS */}
      <div className="telemetry-right-axis">
        <div className="manifest-right-panel">
          <div className="manifest-title-group" style={{ position: 'relative' }}>
            {/* <div className="hero-title-halo dark" /> */}
            <h1 className="manifest-huge-title">CHECKOUT</h1>
            <span className="manifest-cyan-sub">CONFIRM YOUR SELECTION TO PROCEED</span>
          </div>

          <div className="manifest-data-stack">
            <div className="data-row">
              <span className="data-label">PAPER FINISH</span>
              <span className="data-value">PREMIUM HIGH GLOSS</span>
            </div>
            <div className="data-row">
              <span className="data-label">TOTAL AMOUNT</span>
              <span className="data-value">Rp {(40000 + (safeCopies - 1) * 20000).toLocaleString()}</span>
            </div>
            <div className="data-row">
              <span className="data-label">SESSION REFERENCE</span>
              <span className="data-value">KERN V4.2 // ID-92-{Math.floor(Math.random() * 900) + 100}</span>
            </div>
          </div>

          <button className="btn-tier-1" onClick={() => {
            if (safeCopies > 1) setIsCheckoutOpen(true);
            else handleCheckoutSuccess();
          }}>
            {safeCopies > 1 ? "CONFIRM PRINT & PAY" : "CONFIRM PRINT"}
          </button>
        </div>
      </div>

      <GalleryCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          handleCheckoutSuccess();
        }}
        totalPrice={40000 + (safeCopies - 1) * 20000}
        initialPayment={amountPaid}
        orderId={`PHB-${Math.floor(Date.now() / 1000)}`}
        timeLeft={transactionTime}
        devFreeFlow={devFreeFlow}
      />
    </div>
  );
};

export default PrintManifestScreen;
