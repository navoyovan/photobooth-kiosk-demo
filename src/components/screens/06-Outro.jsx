import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';

const OutroScreen = ({ finalImage, type = 'NORMAL', onReset, onExitStart }) => {
  const screenRef = useRef(null);

  useEffect(() => {
    // Entrance: Background fade and Text Zoom In
    animate(screenRef.current, {
      opacity: [0, 1],
      duration: 1000,
      easing: 'easeOutQuad'
    });

    animate('.outro-text', {
      opacity: [0, 1],
      scale: [0.5, 1],
      filter: ['blur(20px)', 'blur(0px)'],
      duration: 1500,
      easing: 'easeOutQuad',
      delay: stagger(300)
    });

    // Stay for 4.5 seconds then start exit animation
    const exitTimer = setTimeout(() => {
      if (onExitStart) onExitStart();
      animate(screenRef.current, {
        opacity: 0,
        duration: 1000,
        easing: 'easeInQuad'
      });

      animate('.outro-text', {
        opacity: 0,
        scale: 0.4, // Zoom Out (settling into distance) as requested
        filter: 'blur(30px)',
        duration: 1500,
        easing: 'easeInQuad',
        delay: stagger(100),
        onComplete: onReset
      });
    }, 4500);

    return () => clearTimeout(exitTimer);
  }, []); // Run once on mount

  const messages = {
    NORMAL: ["MEMORIES ARCHIVED", "ENJOY THE WILDERNESS"],
    TIMEOUT: ["SESSION EXPIRED", "TIME IS A CRUEL MASTER"],
    ABORT: ["SESSION TERMINATED", "SYSTEM RESETTING"]
  };

  const currentMsg = messages[type] || messages.NORMAL;

  return (
    <div ref={screenRef} className="outro-layout">
      <div className="outro-center">
        <h1 className="outro-text main">{currentMsg[0]}</h1>
        <p className="outro-text sub">{currentMsg[1]}</p>
      </div>
    </div>
  );
};

export default OutroScreen;
