import React, { useId } from 'react';
import s from './SquareWaveLoader.module.css';

export default function SquareWaveLoader({
  count = 5,
  color = 'currentColor',
  size = 14,
  gap = 8,
  duration = 2100,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
  className = '',
  style = {},
}) {
  const instanceId = useId().replace(/:/g, '');
  const squares = Array.from({ length: count });

  // Total width calculation
  const totalWidth = (count * size) + ((count - 1) * gap);
  
  const effectiveBounceHeight = totalWidth - size;
  const maxScale = 1 + (effectiveBounceHeight / size);
  const halfBounceHeight = effectiveBounceHeight / 2;
  const halfScale = 1 + (halfBounceHeight / size);

  const dynamicStyles = squares.map((_, i) => {
    const riseBase = 2 + Math.round(i * 2.5);
    const fallBase = riseBase + 44;
    const animationName = `swl-${instanceId}-${i}`;

    return `
      @keyframes ${animationName} {
        0%, ${Math.max(0, riseBase - 2)}% { transform: translateY(0) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Rise Step 1: Anticipation at floor */
        ${riseBase}% { transform: translateY(0) scaleY(0.75); animation-timing-function: ${easing}; }
        
        /* Rise Step 1: Stretch to half height */
        ${riseBase + 5}% { transform: translateY(0) scaleY(${halfScale}); animation-timing-function: ${easing}; }
        
        /* Rise Step 1: Snap to half height */
        ${riseBase + 10}% { transform: translateY(-${halfBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Mid-rise Pause at half height */
        ${riseBase + 13}% { transform: translateY(-${halfBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Rise Step 2: Anticipation at half height */
        ${riseBase + 16}% { transform: translateY(-${halfBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ${easing}; }
        
        /* Rise Step 2: Stretch to ceiling */
        ${riseBase + 21}% { transform: translateY(-${halfBounceHeight}px) scaleY(${halfScale}); animation-timing-function: ${easing}; }
        
        /* Snap to ceiling */
        ${riseBase + 26}% { transform: translateY(-${effectiveBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Ceiling Follow-through */
        ${riseBase + 29}% { transform: translateY(-${effectiveBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ease-in-out; }
        
        /* Rest at ceiling */
        ${riseBase + 32}%, ${fallBase - 2}% { transform: translateY(-${effectiveBounceHeight}px) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Fall Anticipation */
        ${fallBase}% { transform: translateY(-${effectiveBounceHeight + size * 0.25}px) scaleY(0.75); animation-timing-function: ${easing}; }
        
        /* Fall Stretch to floor */
        ${fallBase + 8}% { transform: translateY(0) scaleY(${maxScale}); animation-timing-function: ${easing}; }
        
        /* Snap to floor */
        ${fallBase + 15}% { transform: translateY(0) scaleY(1); animation-timing-function: ease-in-out; }
        
        /* Floor Follow-through */
        ${fallBase + 18}% { transform: translateY(0) scaleY(0.75); animation-timing-function: ease-in-out; }
        
        /* Floor rest */
        ${fallBase + 21}%, 100% { transform: translateY(0) scaleY(1); }
      }
      .swl-square-${instanceId}-${i} {
        animation: ${animationName} ${duration}ms linear infinite;
      }
    `;
  }).join('\n');

  return (
    <div 
      className={`${s.container} ${className}`} 
      style={{ 
        gap: `${gap}px`, 
        width: `${totalWidth}px`,
        height: `${totalWidth}px`,
        ...style 
      }}
    >
      <style>{dynamicStyles}</style>
      {squares.map((_, i) => (
        <div
          key={i}
          className={`${s.square} swl-square-${instanceId}-${i}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}
