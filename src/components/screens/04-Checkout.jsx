import React, { useState, useRef, useEffect } from 'react';
import { animate, createTimeline, stagger, remove } from 'animejs';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';
import styles from './04-Checkout.module.css';

import { entranceAqcuisitionLayout } from '../../utils/transitions';

const PrintManifestScreen = ({ finalImage, printCopies, setPrintCopies, initialCopies, isCheckoutOpen, setIsCheckoutOpen, transactionTime, amountPaid, onNext, devFreeFlow, setIsTimerPaused, checkoutMode, setCheckoutMode, onTimeout }) => {
  const screenRef = useRef();
  const stackContainerRef = useRef();
  const audioRef = useRef();
  const odoDigitRef = useRef();
  const visualAxisRef = useRef();
  const visualAnchorRef = useRef();
  const qtyEngineRef = useRef();
  const manifestPanelRef = useRef();
  const watermarkRef = useRef();
  const footerRef = useRef();
  const cardRefs = useRef([]);

  const timelineRef = useRef(null);

  useEffect(() => {
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    entranceAqcuisitionLayout(tl, {
      duration: 1400,
      elements: {
        watermark: watermarkRef.current,
        qtyEngine: qtyEngineRef.current,
        telemetry: '.telemetry-right-axis' // Keep global for shared axis
      }
    });

    // 1. Master Entrance
    // Subtle entrance that settles at 5vw rightward offset
    if (visualAxisRef.current) {
      tl.add(visualAxisRef.current, {
        translateX: ['8vw', '5vw'],
        opacity: [0, 1],
        duration: 750,
        easing: 'easeOutCubic'
      }, 100);
    }

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
    // Can NOT decrease below what was already paid (initialCopies)
    const minVal = initialCopies || 1;
    if (val < minVal || val > 10) return;
    setPrintCopies(val);
  };

  // Guard against non-number printCopies
  const safeCopies = Number(printCopies) || 1;
  const totalPrice = amountPaid + (safeCopies - initialCopies) * 20000;

  const getRotation = (i) => {
    const seeds = [1.2, -0.8, 1.9, -1.5, 0.5, -1.2, 1.7, -0.3, 0.9, -1.8];
    return seeds[i % seeds.length];
  };

  const handleCheckoutSuccess = () => {
    // Kill the infinite float smoothly by adding the CSS class
    const floater = screenRef.current.querySelector(`.${styles.unoVisualFloat}`);
    if (floater) floater.classList.add(styles.noFloat);

    const tl = createTimeline({
      onComplete: onNext
    });

    // 1. Smoothly return Y to 0 while snapping X back to center
    if (visualAnchorRef.current) {
      tl.add(visualAnchorRef.current, {
        translateY: 0,
        duration: 1000,
        easing: 'easeInOutQuad'
      }, 0);
    }

    if (visualAxisRef.current) {
      tl.add(visualAxisRef.current, {
        translateX: 0,
        opacity: 1, // Keep it visible during transition
        duration: 1000,
        easing: 'easeInOutQuart'
      }, 0);
    }

    // Collapse stack
    const cards = cardRefs.current.filter(Boolean);
    if (cards.length > 0) {
      tl.add(cards, {
        translateX: 0,
        translateY: 0,
        rotate: 0,
        duration: 800,
        easing: 'easeInOutCubic'
      }, 0);

      // Fade out background cards to prevent shadow stacking artifacts
      const backgroundCards = cards.slice(0, -1);
      if (backgroundCards.length > 0) {
        tl.add(backgroundCards, {
          opacity: 0,
          duration: 600,
          easing: 'easeInQuad'
        }, 100);
      }
    }

    // 2. Parallax out the checkout-specific UI
    const uiElements = [manifestPanelRef.current, qtyEngineRef.current, watermarkRef.current].filter(Boolean);
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



  return (
    <div ref={screenRef} className="panel-whole panel-center-content charcoal-solid-background  ">

      {/* 0. GHOST WATERMARK */}
      <div ref={watermarkRef} className="ghost-watermark">DARK<br />ROOM</div>

      {/* 3. LEFT AXIS: THE VERTICAL QTY ENGINE */}
      <div ref={qtyEngineRef} className={styles.qtyEngineAxis}>
        <button className={styles.qtyStepperBtn} onClick={() => handleSetCopies(safeCopies + 1)}>+</button>
        <div className={styles.qtyOdometerWindow}>
          <div
            className={styles.qtyOdometerTape}
            style={{ transform: `translateY(${(1 - safeCopies) * 140}px)` }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <div key={n} ref={safeCopies === n ? odoDigitRef : null} className={styles.qtyOdometerDigit}>
                {n.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        <button className={styles.qtyStepperBtn} onClick={() => handleSetCopies(safeCopies - 1)}>-</button>
      </div>

      <div className="masterpiece-left-axis">
        <div ref={visualAxisRef} className={styles.unoVisualAxis}>
          <div className={styles.unoVisualFloat}>
            <div ref={visualAnchorRef} className={styles.unoVisualAnchor}>
              <div ref={stackContainerRef} className={styles.unoStackContainer}>
                {Array.from({ length: safeCopies }).map((_, index) => {
                  const mid = (safeCopies - 1) / 2;
                  const targetX = (index - mid) * -15;
                  const targetY = (index - mid) * 15;
                  const targetRotate = getRotation(index);
                  return (
                    <div
                      key={index}
                      ref={el => cardRefs.current[index] = el}
                      className={styles.unoCard}
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
        <div ref={manifestPanelRef} className={styles.manifestRightPanel}>
          <div className={styles.manifestTitleGroup} style={{ position: 'relative' }}>
            {/* <div className="hero-title-halo dark" /> */}
            <h1 className={styles.manifestHugeTitle}>CHECKOUT</h1>
            <span className={styles.manifestCyanSub}>CONFIRM YOUR SELECTION TO PROCEED</span>
          </div>

          <div className={styles.manifestDataStack}>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>PAPER FINISH</span>
              <span className={styles.dataValue}>PREMIUM HIGH GLOSS</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>TOTAL AMOUNT</span>
              <span className={styles.dataValue}>Rp {totalPrice.toLocaleString()}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>SESSION REFERENCE</span>
              <span className={styles.dataValue}>KERN V4.2 // ID-92-{Math.floor(Math.random() * 900) + 100}</span>
            </div>
          </div>

          <button className="btn-tier-1" onClick={() => {
            if (safeCopies > initialCopies) {
              setCheckoutMode('PAYMENT');
              setIsCheckoutOpen(true);
            } else {
              setCheckoutMode('CONFIRM');
              setIsCheckoutOpen(true);
            }
          }}>
            {safeCopies > initialCopies ? "CONFIRM PRINT & PAY" : "CONFIRM PRINT"}
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
        totalPrice={totalPrice}
        initialPayment={amountPaid}
        orderId={`PHB-${Math.floor(Date.now() / 1000)}`}
        timeLeft={transactionTime}
        devFreeFlow={devFreeFlow}
        setIsTimerPaused={setIsTimerPaused}
        mode={checkoutMode}
        onTimeout={onTimeout}
      />
    </div>
  );
};

export default PrintManifestScreen;
