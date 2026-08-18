import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { animate, stagger } from 'animejs';
import { convertToWebP, saveToLocalStarfield } from '../../utils/imageProcessor';
import { TRANSLATIONS } from '../../constants/translations';
import { CtaButton, SecondaryButton } from '../../ui';

const OutroScreen = ({ finalImage, type = 'NORMAL', isDonating, onReset, onExitStart, language = 'EN', triggerExit = false }) => {
  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['EN']?.[key] || key;
  };

  const screenRef = useRef(null);
  const [variant, setVariant] = useState(isDonating && type === 'NORMAL' ? 'CONSENT' : 'NORMAL');
  const [isSaving, setIsSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const hasTriggeredRef = useRef(false);

  useLayoutEffect(() => {
    if (variant === 'NORMAL') {
      // Entrance: Background fade and Text Zoom In
      animate(screenRef.current, {
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutQuad'
      });

      animate('.hero-display-text', {
        opacity: [0, 1],
        scale: [0.5, 1],
        filter: ['blur(20px)', 'blur(0px)'],
        duration: 1500,
        easing: 'easeOutQuad',
        delay: stagger(300)
      });

      // Stay for 4.5 seconds then start exit animation (only if not maintenance mode)
      if (type !== 'MAINTENANCE') {
        const exitTimer = setTimeout(() => {
          if (onExitStart) onExitStart();
          animate(screenRef.current, {
            opacity: 0,
            duration: 1000,
            easing: 'easeInQuad'
          });

          animate('.hero-display-text', {
            opacity: 0,
            scale: 0.4,
            filter: 'blur(30px)',
            duration: 1500,
            easing: 'easeInQuad',
            delay: stagger(100),
            onComplete: onReset
          });
        }, 4500);

        return () => clearTimeout(exitTimer);
      }
    } else if (variant === 'CONSENT') {
      // CONSENT Variant Entrance
      animate(screenRef.current, {
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
      });

      animate('.consent-actions', {
        translateY: [15, 0],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutCubic'
      });

      // 10s Countdown to automatic ACCEPT
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (!hasTriggeredRef.current) handleAccept();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [variant, finalImage]);

  useEffect(() => {
    if (triggerExit && type === 'MAINTENANCE') {
      if (onExitStart) onExitStart();
      animate(screenRef.current, {
        opacity: 0,
        duration: 1000,
        easing: 'easeInQuad'
      });

      animate('.hero-display-text', {
        opacity: 0,
        scale: 0.4,
        filter: 'blur(30px)',
        duration: 1500,
        easing: 'easeInQuad',
        delay: stagger(100),
        onComplete: onReset
      });
    }
  }, [triggerExit, type]);

  const handleAccept = async () => {
    if (isSaving || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setIsSaving(true);
    try {
      const webpBlob = await convertToWebP(finalImage);
      await saveToLocalStarfield(webpBlob);

      // "Logic especially the part when it clears the starfield off"
      if (onExitStart) onExitStart();

      // Then move to final message
      setVariant('NORMAL');
    } catch (err) {
      console.error("[Outro] Save failed:", err);
      setVariant('NORMAL');
      hasTriggeredRef.current = false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecline = () => {
    setVariant('NORMAL');
  };

  const messages = {
    NORMAL: [t('normalOutroMsg1'), t('normalOutroMsg2')],
    TIMEOUT: [t('timeoutOutroMsg1'), t('timeoutOutroMsg2')],
    ABORT: [t('abortOutroMsg1'), t('abortOutroMsg2')],
    MAINTENANCE: [t('maintenanceOutroMsg1'), t('maintenanceOutroMsg2')]
  };

  const currentMsg = messages[type] || messages.NORMAL;

  if (variant === 'CONSENT') {
    return (
      <div 
        ref={screenRef} 
        className="hero-display-layout outro active consent-mode"
        style={{ pointerEvents: 'auto', zIndex: 60, opacity: 0 }}
      >
        <div className="hero-display-content" style={{ gap: '1.5rem', padding: '0 clamp(1rem, 5vw, 10vw)', pointerEvents: 'auto' }}>
          <div className="hero-display-halo" style={{ pointerEvents: 'none' }} />

          <h1 className="hero-display-main" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', marginBottom: '0.5rem', letterSpacing: '-0.05rem', lineHeight: 1.1 }}>
            {t('grantExhibitionRights')}
          </h1>

          <p className="hero-display-sub" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', letterSpacing: 'clamp(0.1rem, 0.3vw, 0.3rem)', maxWidth: '800px', lineHeight: '1.6', opacity: 0.8 }}>
            {t('exhibitionRightsDesc')}
          </p>

          <div className="consent-actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', zIndex: 100, position: 'relative', pointerEvents: 'auto', marginTop: '1rem', opacity: 0 }}>
            <SecondaryButton onClick={handleDecline} disabled={isSaving} style={{ minWidth: '160px', mixBlendMode: 'difference', color: '#FFFFFF', pointerEvents: 'auto', cursor: 'pointer' }}>
              {t('decline')}
            </SecondaryButton>
            <CtaButton onClick={handleAccept} disabled={isSaving} style={{ minWidth: '200px', pointerEvents: 'auto', cursor: 'pointer' }}>
              {isSaving ? t('securing') : `${t('acceptPublish')} (${timeLeft}S)`}
            </CtaButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={screenRef} 
      className="hero-display-layout outro active"
      style={{ pointerEvents: 'auto', zIndex: 60, opacity: 0 }}
    >
      <div className="hero-display-content" style={{ pointerEvents: 'auto' }}>
        <div className="hero-display-halo" style={{ pointerEvents: 'none' }} />
        <h1 className="hero-display-main hero-display-text" style={type === 'MAINTENANCE' ? { color: '#ef4444' } : undefined}>{currentMsg[0]}</h1>
        <p className="hero-display-sub hero-display-text" style={type === 'MAINTENANCE' ? { color: '#ef4444', opacity: 0.8, letterSpacing: '0.2rem' } : undefined}>{currentMsg[1]}</p>
      </div>
    </div>
  );
};

export default OutroScreen;
