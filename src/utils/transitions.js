import { stagger } from 'animejs';

/**
 * Editorial Transition Bundles
 * Consolidates standard parallax exit/entrance patterns into single calls.
 */

/**
 * Exit Bundle: Slides panels left and fades background watermarks.
 * Used when transitioning FORWARD to the next screen.
 */
export const exitEditorialLayout = (tl, options = {}) => {
  const { duration = 400, offset = 0 } = options;

  // 1. Background Watermarks (Deepest parallax)
  tl.add(['.watermark-sideways', '.ghost-capture-watermark'], {
    translateX: -120,
    opacity: [0.04, 0],
    duration: duration * 1.2,
    easing: 'easeInQuart'
  }, offset);

  // 2. UI Panels (Slide out with stagger)
  tl.add(['.panel-left', '.panel-right'], {
    translateX: -100,
    opacity: 0,
    duration: duration,
    easing: 'easeInQuad',
    // delay: stagger(100)
  }, 200);

  // 3. Flash to white/dark overlay if exists
  if (document.querySelector('.page-exit-overlay')) {
    tl.add('.page-exit-overlay', {
      opacity: [0, 1],
      duration: duration * 0.75,
      easing: 'linear'
    }, `-=${duration * 0.5}`);
  }

  return tl;
};

/**
 * Entrance Bundle: Slides panels in from the right.
 * Used when a screen first MOUNTS.
 */
export const entranceEditorialLayout = (tl, options = {}) => {
  const { duration = 800, offset = 0 } = options;

  // 1. Background Watermarks (Slide in deepest)
  tl.add('.watermark-sideways', {
    translateX: [300, 0],
    opacity: [0, 0.04],
    duration: duration * 1.3,
    easing: 'easeOutQuart'
  }, offset);

  // 2. UI Panels (Slide in with stagger)
  tl.add(['.panel-left', '.panel-right'], {
    translateX: [150, 0],
    opacity: [0, 1],
    duration: duration,
    easing: 'easeOutCubic',
    // delay: stagger(150)
  }, offset + 100);

  return tl;
};

// export const entranceViewfinderLayout = (tl, options = {}) => {
//   const { duration = 800, offset = 0 } = options;

//   tl.add('.watermark', {
//     translateX: [300, 0],
//     opacity: [0, 0.04],
//     duration: duration * 1.3,
//     easing: 'easeOutQuart'
//   }, offset);

//   return tl;
// }

export const entranceAqcuisitionLayout = (tl, options = {}) => {
  const { duration = 800, offset = 0, elements = {} } = options;

  const watermark = elements.watermark || '.ghost-watermark';
  const qtyEngine = elements.qtyEngine || '.qty-engine-axis';
  const telemetry = elements.telemetry || '.telemetry-right-axis';

  tl.add(watermark, {
    translateX: ['-35%', '-50%'],
    translateY: ['-50%', '-50%'],
    opacity: [0, 1],
    duration: duration,
    easing: 'easeOutQuart'
  });

  tl.add(qtyEngine, {
    translateX: [150, 0],
    translateY: ['-50%', '-50%'],
    opacity: [0, 1],
    duration: 650,
    easing: 'easeOutCubic'
  }, 150)

  tl.add(telemetry, {
    translateX: [100, 0],
    opacity: [0, 1],
    duration: 800,
    easing: 'easeOutQuad'
  }, 200);

}
