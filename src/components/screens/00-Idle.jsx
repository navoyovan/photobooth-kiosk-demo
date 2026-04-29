import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const IdleScreen = ({ onNext, onTransitionStart }) => {
  const screenRef = useRef();

  useGSAP(() => {
    gsap.from(screenRef.current, {
      opacity: 0,
      scale: 1.1,
      duration: 1.2,
      ease: "power3.out"
    });
  }, []);

  const handleTap = () => {
    // 1. Trigger the background tunnel effect immediately
    if (onTransitionStart) onTransitionStart();

    // 2. Cinematic exit for the title (Scale up + Blur + Fade)
    gsap.to(".title-cinematic", {
      scale: 1.8,
      opacity: 0,
      filter: "blur(40px)",
      duration: 0.9,
      ease: "power4.inOut"
    });

    // 3. Slide the CTA down
    gsap.to(".cta-anchor", {
      y: 100,
      opacity: 0,
      duration: 0.7,
      ease: "power3.in"
    });

    // 4. Proceed to next screen after animation completes
    setTimeout(onNext, 800);
  };

  return (
    <div ref={screenRef} className="screen-container idle-screen-vibe" onClick={handleTap} style={{ zIndex: 10, background: 'none' }}>
      <h1 className="title-cinematic">Hype - Box</h1>
      <div className="cta-anchor">
        <p className="cta-default">TAP SCREEN TO INITIATE</p>
      </div>
    </div>
  );
};

export default IdleScreen;
