import React, { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const STEPS = ['Hy, Hlo!', '01', '02', '03', '04', 'Pending Additional Payment', '05', 'THANK YOU'];
const PHASES = [
  { id: 'PYMT', steps: [1] },
  { id: 'CNVS', steps: [2] },
  { id: 'CPTR', steps: [3] },
  { id: 'PRNT', steps: [4, 5, 6] }
];

const KineticPagination = ({ currentStep, subState, isVisible, onBack, backLabel, isCheckoutModalOpen }) => {
  const containerRef = useRef(null);
  const timeline = useRef(null);

  useGSAP(() => {
    timeline.current = gsap.timeline({ paused: true });

    // Main reveal
    timeline.current.fromTo(containerRef.current,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 1, ease: "power4.out" }
    );

    // Kinetic Asterisk "pop"
    timeline.current.fromTo(".kinetic-asterisk",
      { scale: 0, rotation: -90 },
      { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" },
      "-=0.6"
    );

    // Staggered Phase items
    timeline.current.fromTo(".phase-item",
      { y: 10, opacity: 0 },
      { y: 0, opacity: "", duration: 0.6, stagger: 0.05, ease: "power2.out" },
      "-=0.4"
    );

    // Back button reveal
    timeline.current.fromTo(".kinetic-back-btn",
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );
  }, { scope: containerRef });

  useEffect(() => {
    if (isVisible) {
      timeline.current?.play();
    } else {
      timeline.current?.reverse();
    }
  }, [isVisible]);

  // Determine tape index
  let tapeIndex = 0;
  if (currentStep === 1) tapeIndex = 0; // 0X
  if (currentStep === 2) tapeIndex = 1; // 01
  if (currentStep === 3) {
    tapeIndex = subState === 'viewfinder' ? 2 : 3; // 02 : 03
  }
  if (currentStep === 4) {
    tapeIndex = isCheckoutModalOpen ? 5 : 4; // 04 : 04a
  }
  if (currentStep === 5) tapeIndex = 6; // 05
  if (currentStep === 6) tapeIndex = 7; // THANK YOU

  return (
    <div ref={containerRef} className="kinetic-pagination-container" style={{ opacity: 0 }}>
      <div className="kinetic-main-row">
        <span className="kinetic-asterisk">*</span>
        <div className="kinetic-slot-window">
          <div
            className="kinetic-number-tape"
            style={{ transform: `translateY(-${tapeIndex}em)` }}
          >
            {STEPS.map((s, i) => (
              <div key={i} className="kinetic-number-item">{s}</div>
            ))}
          </div>
        </div>
      </div>


      <div className="kinetic-phase-tracker" style={{ marginTop: '0.5rem' }}>
        {PHASES.map((phase, i) => {
          const isActive = phase.steps.includes(currentStep);
          return (
            <React.Fragment key={phase.id}>
              <span className={`phase-item ${isActive ? 'active' : ''}`}>
                {phase.id}
              </span>
              {i < PHASES.length - 1 && <span className="phase-divider">—</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* Reserved Space for Back Button at the bottom */}
      <div style={{ height: '3rem', marginTop: '1.2rem', display: 'flex', alignItems: 'flex-start' }}>
        {onBack && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="kinetic-back-btn"
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 1)',
                fontFamily: 'Space Grotesk',
                fontSize: '0.75rem',
                fontWeight: 500,
                padding: '0.8rem 2rem',
                letterSpacing: '0.12rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                pointerEvents: 'auto',
                transition: 'all 0.3s ease',
                position: 'relative',
                zIndex: 2,

              }}
            >
              {backLabel || '← BACK'}
            </button>
            <div className="boundary-dashed-line" style={{ opacity: 1, borderColor: 'var(--accent-color)' }}></div>
          </div>
        )}
      </div>
    </div >
  );
};

export default KineticPagination;
