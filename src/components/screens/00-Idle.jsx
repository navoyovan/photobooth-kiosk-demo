import React, { useRef, useEffect, useState } from 'react';
import { animate, createTimeline } from 'animejs';

const IdleScreen = ({ 
  onNext, 
  onTransitionStart, 
  brandType = 'text', 
  brandText = 'Hype - Box', 
  brandLogo = '/assets/main-logo.png',
  brandTextScale = '100',
  brandLogoScale = '100'
}) => {
  const screenRef = useRef();
  const titleRef = useRef();
  const ctaRef = useRef();
  const [logoError, setLogoError] = useState(false);

  // Compute scale factors
  const textScaleVal = Number(brandTextScale) / 100 || 1;
  const logoScaleVal = Number(brandLogoScale) / 100 || 1;

  // Scale via layout dimensions to prevent transform/animation overlap conflicts
  const logoMaxWidth = `${50 * logoScaleVal}vw`;
  const logoMaxHeight = `${25 * logoScaleVal}vh`;

  // Scale via typographic dimensions
  const textFontSize = `${10 * textScaleVal}vw`;
  const textLetterSpacing = `${-0.6 * textScaleVal}vw`;

  useEffect(() => {
    // Entrance: Synchronized with Starfield FOV transform (1.3s - 1.8s)
    const tl = createTimeline();

    if (titleRef.current) {
      tl.add(titleRef.current, {
        opacity: [0, 1],
        scale: [1.3, 1],
        filter: ['blur(20px)', 'blur(0px)'],
        duration: 1600,
        easing: 'easeInOutQuad'
      });
    }

    tl.add(ctaRef.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1200,
      easing: 'easeOutCubic'
    }, '-=800'); // Staggered overlap
  }, [logoError, brandType]); // Re-trigger if error forces fallback to text

  const handleTap = () => {
    // 1. Trigger the background tunnel effect immediately
    if (onTransitionStart) onTransitionStart();

    // 2. Cinematic exit for the title/logo (Scale up + Blur + Fade)
    if (titleRef.current) {
      animate(titleRef.current, {
        scale: 1.8,
        opacity: 0,
        filter: 'blur(40px)',
        duration: 1100,
        easing: 'easeInOutQuart'
      });
    }

    // 3. Slide the CTA down
    animate(ctaRef.current, {
      translateY: 100,
      opacity: 0,
      duration: 1000,
      easing: 'easeInCubic'
    });

    // 4. Proceed to next screen after animation completes
    setTimeout(onNext, 1200);
  };

  const showLogo = brandType === 'logo' && !logoError;

  return (
    <div
      ref={screenRef}
      className="hero-display-layout intro active"
      onClick={handleTap}
    >
      <div className="hero-display-content">
        <div className="hero-display-halo" />
        {showLogo ? (
          <img 
            ref={titleRef}
            src={brandLogo} 
            alt={brandText} 
            className="hero-display-logo" 
            style={{ maxWidth: logoMaxWidth, maxHeight: logoMaxHeight, opacity: 0 }}
            onError={() => {
              console.warn(`[Idle] Failed to load brand logo: ${brandLogo}. Falling back to text: "${brandText}"`);
              setLogoError(true);
            }}
          />
        ) : (
          <h1 
            ref={titleRef} 
            className="hero-display-main"
            style={{ fontSize: textFontSize, letterSpacing: textLetterSpacing, opacity: 0 }}
          >
            {brandText}
          </h1>
        )}
        <div ref={ctaRef} className="hero-display-sub" style={{ opacity: 0 }}>
          <p className="ctaLabel">TAP SCREEN TO INITIATE</p>
        </div>
      </div>
    </div>
  );
};

export default IdleScreen;
