import React, { useState, useRef, useEffect } from 'react';
import { createTimeline, stagger } from 'animejs';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';
import { OdometerStepper, UnoCardStack } from '../shared/CardStackOdometer';
import styles from './04-Checkout.module.css';
import { entranceAqcuisitionLayout } from '../../utils/transitions';
import { TRANSLATIONS } from '../../constants/translations';
import { CtaButton } from '../../ui';

const PrintManifestScreen = ({ finalImage, printCopies, setPrintCopies, initialCopies, isCheckoutOpen, setIsCheckoutOpen, transactionTime, amountPaid, onNext, devFreeFlow, setIsTimerPaused, checkoutMode, setCheckoutMode, onTimeout, sessionHash, bypassMode = false, language = 'EN' }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef();
  const stackContainerRef = useRef();
  const visualAxisRef = useRef();
  const visualAnchorRef = useRef();
  const qtyEngineRef = useRef();
  const manifestPanelRef = useRef();
  const watermarkRef = useRef();
  const cardRefs = useRef([]);

  const timelineRef = useRef(null);

  useEffect(() => {
    setIsCheckoutOpen(false);
    if (timelineRef.current) timelineRef.current.pause();
    const tl = createTimeline();
    timelineRef.current = tl;

    entranceAqcuisitionLayout(tl, {
      duration: 700,
      elements: {
        watermark: watermarkRef.current,
        qtyEngine: qtyEngineRef.current,
        telemetry: '.telemetry-right-axis'
      }
    });

    if (visualAxisRef.current) {
      tl.add(visualAxisRef.current, {
        translateX: ['8vw', '5vw'],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutCubic'
      }, 50);
    }

    return () => {
      if (tl) tl.pause();
    };
  }, []);

  const handleSetCopies = (val) => {
    const minVal = initialCopies || 1;
    if (val < minVal || val > 10) return;
    setPrintCopies(val);
  };

  const safeCopies = Number(printCopies) || 1;
  const totalPrice = amountPaid + (safeCopies - initialCopies) * 20000;

  const handleCheckoutSuccess = (agreedToUpload = true) => {
    const floater = screenRef.current.querySelector(`.${styles.unoVisualFloat}`);
    if (floater) floater.classList.add(styles.noFloat);

    const tl = createTimeline({
      onComplete: () => onNext(agreedToUpload)
    });

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
        opacity: 1,
        duration: 1000,
        easing: 'easeInOutQuart'
      }, 0);
    }

    const cards = cardRefs.current.filter(Boolean);
    if (cards.length > 0) {
      // Clear CSS transition delays so all cards collapse together immediately in unison
      cards.forEach((card) => {
        if (card) {
          card.style.transitionDelay = '0ms';
          card.style.transition = 'none';
        }
      });

      tl.add(cards, {
        translateX: 0,
        translateY: 0,
        rotate: 0,
        scale: 1,
        filter: 'brightness(100%)',
        duration: 700,
        easing: 'easeInOutCubic'
      }, 0);

      const backgroundCards = cards.slice(0, -1);
      if (backgroundCards.length > 0) {
        tl.add(backgroundCards, {
          opacity: 0,
          duration: 500,
          easing: 'easeInQuad'
        }, 200);
      }
    }

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
    <div ref={screenRef} className="panel-whole panel-center-content charcoal-solid-background">
      {/* 0. GHOST WATERMARK */}
      <div ref={watermarkRef} className="ghost-watermark">DARK<br />ROOM</div>

      {/* 1. LEFT AXIS: STANDALONE ODOMETER STEPPER */}
      <OdometerStepper
        ref={qtyEngineRef}
        count={safeCopies}
        onChange={handleSetCopies}
        min={initialCopies || 1}
        max={10}
        size="large"
        theme="dark"
        standalone={true}
      />

      {/* 2. MASTERPIECE LEFT AXIS: FLOATING UNO CARD STACK */}
      <div className="masterpiece-left-axis">
        <div ref={visualAxisRef} className={styles.unoVisualAxis}>
          <div className={styles.unoVisualFloat}>
            <div ref={visualAnchorRef} className={styles.unoVisualAnchor}>
              <UnoCardStack
                ref={stackContainerRef}
                count={safeCopies}
                imageSrc={finalImage || "/taken_pic/default.png"}
                size="large"
                cardRefs={cardRefs}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SHARED TELEMETRY AXIS */}
      <div className="telemetry-right-axis">
        <div ref={manifestPanelRef} className={styles.manifestRightPanel}>
          <div className={styles.manifestTitleGroup} style={{ position: 'relative' }}>
            {/* <div className="hero-title-halo dark" /> */}
            <h1 className={styles.manifestHugeTitle}>{t('checkoutTitle')}</h1>
            <span className={styles.manifestCyanSub}>{t('confirmSelectionProceed')}</span>
          </div>

          <div className={styles.manifestDataStack}>
            {/* <div className={styles.dataRow}>
              <span className={styles.dataLabel}>{t('paperFinish')}</span>
              <span className={styles.dataValue}>{t('premiumHighGloss')}</span>
            </div> */}
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>{t('totalAmount')}</span>
              <span className={styles.dataValue}>Rp {totalPrice.toLocaleString()}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>{t('sessionRef')}</span>
              <span className={styles.dataValue}>DEMO V1.0 // {sessionHash}</span>
            </div>
          </div>

          <CtaButton onClick={() => {
            setCheckoutMode('CONFIRM');
            setIsCheckoutOpen(true);
          }}>
            {t('confirmPrint')}
          </CtaButton>
        </div>
      </div>

      <GalleryCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(agreed) => {
          setIsCheckoutOpen(false);
          handleCheckoutSuccess(agreed);
        }}
        totalPrice={totalPrice}
        initialPayment={amountPaid}
        orderId={`PHB-${Math.floor(Date.now() / 1000)}`}
        timeLeft={transactionTime}
        devFreeFlow={devFreeFlow}
        setIsTimerPaused={setIsTimerPaused}
        mode={checkoutMode}
        onTimeout={onTimeout}
        bypassMode={bypassMode}
        language={language}
      />
    </div>
  );
};

export default PrintManifestScreen;
