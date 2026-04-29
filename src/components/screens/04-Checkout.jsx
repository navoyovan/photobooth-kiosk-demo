import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import GalleryCheckoutModal from '../shared/GalleryCheckoutModal';

const PrintManifestScreen = ({ finalImage, printCopies, setPrintCopies, isCheckoutOpen, setIsCheckoutOpen, onNext }) => {
  const screenRef = useRef();
  const stackContainerRef = useRef();
  const audioRef = useRef();
  const odoDigitRef = useRef();

  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Master Entrance
    tl.from(".ghost-watermark", {
      x: 300,
      opacity: 0,
      duration: 1.1,
      ease: "power4.out"
    }, 0.05);

    tl.from(".qty-engine-axis", {
      x: 150,
      opacity: 0,
      duration: 0.65,
      ease: "power3.out"
    }, 0.15);

    // Entrance with the 5vw rightward offset
    tl.fromTo(".uno-visual-axis", 
      { x: 150, opacity: 0, scale: 0.9 },
      { x: "5vw", opacity: 1, scale: 1, duration: 0.75, ease: "power3.out" }, 
      0.1
    );

    tl.from(".manifest-right-panel", {
      x: 80,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    }, 0.2);

    // 2. Start Infinite Float via GSAP (so we can smoothly kill it)
    gsap.to(".uno-visual-anchor", {
      y: -20,
      duration: 3,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1
    });

  }, { scope: screenRef });

  // Punchy QTY Animation
  useEffect(() => {
    if (odoDigitRef.current) {
      gsap.fromTo(odoDigitRef.current,
        { scale: 0.5, opacity: 0, filter: "blur(10px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "back.out(1.7)" }
      );
    }
  }, [printCopies]);

  // THE COMPRESSION: Stack reaction when quantity increases
  const lastCount = useRef(printCopies);
  useEffect(() => {
    if (printCopies > lastCount.current && stackContainerRef.current) {
      gsap.fromTo(stackContainerRef.current,
        { scale: 0.99, y: 5 },
        { scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
    lastCount.current = printCopies;
  }, [printCopies]);

  const handleSetCopies = (val) => {
    if (val < 1 || val > 10) return;
    setPrintCopies(val);

    // Sound effect on change
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  };

  const totalPrice = 40000 + (printCopies - 1) * 20000;

  const getRotation = (i) => {
    const seeds = [1.2, -0.8, 1.9, -1.5, 0.5, -1.2, 1.7, -0.3, 0.9, -1.8];
    return seeds[i % seeds.length];
  };

  const handleCheckoutSuccess = () => {
    // Kill the infinite float smoothly
    gsap.killTweensOf(".uno-visual-anchor");

    const tl = gsap.timeline({
      onComplete: onNext
    });

    // 1. Smoothly return Y to 0 while snapping X back to center
    tl.to(".uno-visual-anchor", {
      y: 0,
      duration: 1.0,
      ease: "power2.inOut"
    }, 0);

    tl.to(".uno-visual-axis", {
      x: 0,
      duration: 1.0,
      ease: "power4.inOut"
    }, 0);

    // Collapse stack
    tl.to(".uno-card", {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.8,
      ease: "power3.inOut"
    }, 0);

    // Fade out background cards to prevent shadow stacking artifacts
    tl.to(".uno-card:not(:last-child)", {
      opacity: 0,
      duration: 0.6,
      ease: "power2.in"
    }, 0.1);

    // 2. Parallax out the checkout-specific UI
    tl.to([".manifest-right-panel", ".qty-engine-axis", ".ghost-watermark"], {
      opacity: 0,
      x: -100,
      duration: 0.6,
      ease: "power2.in",
      stagger: 0.05
    }, 0);
  };

  // Guard against non-number printCopies
  const safeCopies = Number(printCopies) || 1;

  return (
    <div ref={screenRef} className="darkroom-pedestal editorial-shared-layout">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" preload="auto"></audio>

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

      {/* SHARED MASTERPIECE AXIS */}
      <div className="masterpiece-left-axis">
        <div className="uno-visual-axis">
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

      {/* SHARED TELEMETRY AXIS */}
      <div className="telemetry-right-axis">
        <div className="manifest-right-panel">
          <div className="manifest-title-group">
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
        orderId={`PHB-${Math.floor(Date.now() / 1000)}`}
      />
    </div>
  );
};

export default PrintManifestScreen;
