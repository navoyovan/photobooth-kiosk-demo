import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { animate } from 'animejs';
import styles from './CardStackOdometer.module.css';

export const ROTATION_SEEDS = [1.2, -0.8, 1.9, -1.5, 0.5, -1.2, 1.7, -0.3, 0.9, -1.8];

/**
 * 1. ODOMETER STEPPER COMPONENT (Swipeable / Interactive)
 */
export const OdometerStepper = forwardRef(({
  count = 1,
  onChange,
  min = 1,
  max = 10,
  size = 'compact',
  theme = 'light',
  standalone = false,
  className = ''
}, ref) => {
  const odoDigitRef = useRef(null);
  const safeCount = Math.max(min, Math.min(max, Number(count) || 1));
  const digitHeight = size === 'large' ? 140 : 100;

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const dragStartCount = useRef(safeCount);
  const lastEmittedCount = useRef(safeCount);

  useEffect(() => {
    lastEmittedCount.current = safeCount;
  }, [safeCount]);

  // Punchy QTY Animation on digit change (only when stepped via button or settled)
  useEffect(() => {
    if (odoDigitRef.current && !isDragging) {
      animate(odoDigitRef.current, {
        scale: [size === 'large' ? 0.7 : 0.85, 1],
        opacity: [0, 1],
        filter: ['blur(4px)', 'blur(0px)'],
        duration: 350,
        easing: 'easeOutBack(1.7)'
      });
    }
  }, [safeCount, size, isDragging]);

  const handleStep = (delta) => {
    const next = safeCount + delta;
    if (next >= min && next <= max && onChange) {
      onChange(next);
    }
  };

  // Pointer Swipe / Drag Interaction (Mouse & Touch)
  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartCount.current = safeCount;
    lastEmittedCount.current = safeCount;
    setDragOffset(0);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartY.current;

    // Boundary resistance (rubber banding when pulling past min or max)
    const isPastTop = dragStartCount.current >= max && deltaY < 0;
    const isPastBottom = dragStartCount.current <= min && deltaY > 0;
    const effectiveDelta = (isPastTop || isPastBottom) ? deltaY * 0.2 : deltaY;

    setDragOffset(effectiveDelta);

    // Step calculation: swiping UP (negative delta) increases count; DOWN (positive delta) decreases count
    const stepsDelta = -Math.round(deltaY / (digitHeight * 0.55));
    const targetCount = Math.max(min, Math.min(max, dragStartCount.current + stepsDelta));

    if (targetCount !== lastEmittedCount.current && onChange) {
      lastEmittedCount.current = targetCount;
      onChange(targetCount);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragOffset(0);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Mouse wheel scroll support
  const wheelLock = useRef(null);
  const handleWheel = (e) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 20) {
      const delta = e.deltaY < 0 ? 1 : -1;
      handleStep(delta);
      wheelLock.current = setTimeout(() => {
        wheelLock.current = null;
      }, 180);
    }
  };

  const digits = Array.from({ length: max }, (_, i) => i + 1);

  const themeClass = theme === 'dark' ? styles.themeDark : styles.themeLight;
  const sizeClass = size === 'large' ? styles.sizeLarge : styles.sizeCompact;
  const standaloneClass = standalone && size === 'large' ? styles.standaloneLarge : '';

  // Dynamic tape transform calculation during active drag vs settled state
  const baseTranslate = (1 - safeCount) * digitHeight;
  const finalTranslate = isDragging
    ? (1 - dragStartCount.current) * digitHeight + dragOffset
    : baseTranslate;

  return (
    <div
      ref={ref}
      className={`${styles.qtyEngineAxis} ${themeClass} ${sizeClass} ${standaloneClass} ${className}`}
    >
      <button
        className={styles.qtyStepperBtn}
        onClick={() => handleStep(1)}
        disabled={safeCount >= max}
        aria-label="Increase copies"
      >
        +
      </button>

      <div
        className={`${styles.qtyOdometerWindow} ${isDragging ? styles.isDragging : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className={styles.qtyOdometerTape}
          style={{
            transform: `translateY(${finalTranslate}px)`,
            transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)'
          }}
        >
          {digits.map((n) => (
            <div
              key={n}
              ref={safeCount === n ? odoDigitRef : null}
              className={styles.qtyOdometerDigit}
            >
              {n.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      <button
        className={styles.qtyStepperBtn}
        onClick={() => handleStep(-1)}
        disabled={safeCount <= min}
        aria-label="Decrease copies"
      >
        -
      </button>
    </div>
  );
});

/**
 * 2. UNO CARD STACK COMPONENT
 */
export const UnoCardStack = forwardRef(({
  count = 1,
  imageSrc = '/assets/payment_qty.png',
  size = 'compact',
  cardRefs,
  className = ''
}, ref) => {
  const internalStackRef = useRef(null);
  const actualStackRef = ref || internalStackRef;
  const lastCount = useRef(count);

  const safeCount = Math.max(1, Math.min(10, Number(count) || 1));
  const xOffsetMultiplier = size === 'large' ? -15 : -10;
  const yOffsetMultiplier = size === 'large' ? 15 : 10;
  const brightnessDrop = size === 'large' ? 4 : 1.1;

  // Compression kick on count increase
  useEffect(() => {
    if (safeCount > lastCount.current && actualStackRef.current) {
      animate(actualStackRef.current, {
        scale: [size === 'large' ? 0.99 : 0.98, 1],
        translateY: [size === 'large' ? 5 : 4, 0],
        duration: 300,
        easing: 'easeOutQuad'
      });
    }
    lastCount.current = safeCount;
  }, [safeCount, size, actualStackRef]);

  const getRotation = (i) => ROTATION_SEEDS[i % ROTATION_SEEDS.length];
  const sizeClass = size === 'large' ? styles.sizeLarge : styles.sizeCompact;

  return (
    <div
      ref={actualStackRef}
      className={`${styles.unoStackContainer} ${sizeClass} ${className}`}
    >
      {Array.from({ length: safeCount }).map((_, index) => {
        const mid = (safeCount - 1) / 2;
        const targetX = (index - mid) * xOffsetMultiplier;
        const targetY = (index - mid) * yOffsetMultiplier;
        const targetRotate = getRotation(index);
        // Stagger cards from top to bottom when fanning and backing out
        const staggerDelay = Math.min((safeCount - 1 - index) * 35, 280);

        const targetScale = 1 - (safeCount - 1 - index) * 0.02;

        return (
          <div
            key={index}
            ref={(el) => {
              if (cardRefs) {
                if (Array.isArray(cardRefs.current)) {
                  cardRefs.current[index] = el;
                } else if (typeof cardRefs === 'function') {
                  cardRefs(el, index);
                }
              }
            }}
            className={styles.unoCard}
            style={{
              zIndex: index,
              transform: `translate(${targetX}px, ${targetY}px) rotate(${targetRotate}deg) scale(${targetScale})`,
              filter: `brightness(${100 - (safeCount - index - 1) * brightnessDrop}%)`,
              transitionDelay: `${staggerDelay}ms`
            }}
          >
            <img src={imageSrc} alt={`Card copy ${index + 1}`} />
          </div>
        );
      })}
    </div>
  );
});

/**
 * 3. COMBINED INLINE CARD STACK & ODOMETER
 */
const CardStackOdometer = ({
  count = 1,
  onChange,
  imageSrc = '/assets/payment_qty.png',
  size = 'compact',
  theme = 'light',
  min = 1,
  max = 10,
  enableFloat = true,
  visualAxisRef,
  visualAnchorRef,
  stackContainerRef,
  qtyEngineRef,
  cardRefs,
  className = ''
}) => {
  const sizeClass = size === 'large' ? styles.sizeLarge : styles.sizeCompact;

  return (
    <div className={`${styles.combinedContainer} ${sizeClass} ${className}`}>
      <OdometerStepper
        ref={qtyEngineRef}
        count={count}
        onChange={onChange}
        min={min}
        max={max}
        size={size}
        theme={theme}
      />

      <div ref={visualAxisRef} className={styles.unoVisualAxis}>
        <div className={enableFloat ? styles.unoVisualFloat : undefined}>
          <div ref={visualAnchorRef}>
            <UnoCardStack
              ref={stackContainerRef}
              count={count}
              imageSrc={imageSrc}
              size={size}
              cardRefs={cardRefs}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardStackOdometer;
