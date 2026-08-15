import React, { useRef, useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { SecondaryButton } from '../../ui';

const STEPS = ['Welcome', '01', '02', '03', '04', 'Pending', '05'];
const PHASES = [
  { id: 'HELO', steps: [1] },
  { id: 'CNVS', steps: [2] },
  { id: 'CPTR', steps: [3] },
  { id: 'PRNT', steps: [4, 5] }
];

const KineticPagination = ({ currentStep, subState, isVisible, onBack, backLabel, isCheckoutModalOpen }) => {
  const containerRef = useRef(null);

  // 1. MAIN ENTRANCE / EXIT (Container level)
  useEffect(() => {
    if (isVisible) {
      animate(containerRef.current, {
        translateX: [-50, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutQuart'
      });
    } else {
      animate(containerRef.current, {
        translateX: -50,
        opacity: 0,
        duration: 800, // Slower exit for editorial feel
        easing: 'easeInQuart'
      });
    }
  }, [isVisible]);

  // 2. INTERNAL ELEMENTS (Back Button & Asterisk)
  useEffect(() => {
    if (!isVisible) return;

    // We animate the back button independently so it doesn't trigger a container re-fade
    const backBtn = containerRef.current.querySelector(".kinetic-back-btn, .kiosk-btn-secondary");
    if (backBtn) {
      animate(backBtn, {
        translateX: [-20, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad'
      });
    }

    // Kinetic Asterisk "pop" - only on mount or visibility
    animate('.kinetic-asterisk', {
      scale: [0, 1],
      rotate: [-90, 0],
      duration: 800,
      easing: 'easeOutElastic(1, 0.5)'
    });
  }, [isVisible, !!onBack, backLabel]);

  // 3. PHASE ITEMS (Staggered translation without overriding CSS opacity)
  useEffect(() => {
    if (!isVisible) return;

    const tracker = containerRef.current.querySelector(".kinetic-phase-tracker");
    if (tracker) {
      animate(tracker, {
        translateX: [15, 0],
        duration: 600,
        easing: 'easeOutQuad'
      });
    }
  }, [isVisible]);

  // Determine tape index
  let tapeIndex = 0;
  if (currentStep === 1) tapeIndex = 0; // 0X
  else if (currentStep === 2) tapeIndex = 1; // 01
  else if (currentStep === 3) {
    tapeIndex = subState === 'viewfinder' ? 2 : 3; // 02 : 03
  }
  else if (currentStep === 4) {
    tapeIndex = isCheckoutModalOpen ? 5 : 4; // 04 : 04a
  }
  else if (currentStep >= 5) {
    tapeIndex = 6; // 05
  }

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
            <SecondaryButton
              className="kinetic-back-btn"
              onClick={onBack}
            >
              {backLabel || '← BACK'}
            </SecondaryButton>
          </div>
        )}
      </div>
    </div >
  );
};

export default KineticPagination;
