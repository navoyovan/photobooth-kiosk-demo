import React, { useRef, useEffect } from 'react';
import { animate, createTimeline } from 'animejs';

const IdleScreen = ({ onNext, onTransitionStart }) => {
  const screenRef = useRef();

  useEffect(() => {
    // Entrance: Synchronized with Starfield FOV transform (1.3s - 1.8s)
    const tl = createTimeline();

    tl.add('.title-cinematic', {
      opacity: [0, 1],
      scale: [1.3, 1],
      filter: ['blur(20px)', 'blur(0px)'],
      duration: 1600,
      easing: 'easeInOutQuad'
    });

    tl.add('.cta-anchor', {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 1200,
      easing: 'easeOutCubic'
    }, '-=800'); // Staggered overlap
  }, []);

  const handleTap = () => {
    // 1. Trigger the background tunnel effect immediately
    if (onTransitionStart) onTransitionStart();

    // 2. Cinematic exit for the title (Scale up + Blur + Fade)
    animate('.title-cinematic', {
      scale: 1.8,
      opacity: 0,
      filter: 'blur(40px)',
      duration: 1100,
      easing: 'easeInOutQuart'
    });

    // 3. Slide the CTA down
    animate('.cta-anchor', {
      translateY: 100,
      opacity: 0,
      duration: 1000,
      easing: 'easeInCubic'
    });

    // 4. Proceed to next screen after animation completes
    setTimeout(onNext, 1200);
  };

  return (
    <div ref={screenRef} className="screen-container idle-screen-vibe" onClick={handleTap} style={{ zIndex: 10, background: 'none' }}>
      <div className="hero-h1-container" style={{ marginLeft: 0, marginBottom: 0 }}>
        <div className="hero-title-halo" />
        <h1 className="title-cinematic">Hype - Box</h1>
      </div>
      <div className="cta-anchor">
        <p className="cta-default">TAP SCREEN TO INITIATE</p>
      </div>
    </div>
  );
};

export default IdleScreen;
