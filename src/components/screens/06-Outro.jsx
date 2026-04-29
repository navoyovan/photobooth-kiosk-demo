import React, { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const OutroScreen = ({ finalImage, type = 'NORMAL', onReset }) => {
  const screenRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(onReset, 6000); // 6 seconds for the dramatic reveal
    return () => clearTimeout(timer);
  }, []);

  useGSAP(() => {
    gsap.from(".outro-text", {
      opacity: 0,
      scale: 0.9,
      duration: 1.5,
      ease: "power2.out",
      stagger: 0.3
    });
  }, []);

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
