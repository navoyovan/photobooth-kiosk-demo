/**
 * Frame Layout Constants (Percentage-based)
 * x, y, w, h are 0-100 values
 */
export const DEFAULT_LAYOUTS = {
  // 4-Grid Square Collage
  'GRID_4': [
    { id: 0, x: 0,  y: 0,  w: 50, h: 50 },
    { id: 1, x: 50, y: 0,  w: 50, h: 50 },
    { id: 2, x: 0,  y: 50, w: 50, h: 50 },
    { id: 3, x: 50, y: 50, w: 50, h: 50 }
  ],
  
  // Single Full Frame (Space)
  'SINGLE': [
    { id: 0, x: 0, y: 0, w: 100, h: 100 }
  ],

  // 3-Photo Vertical Strip (Example)
  'STRIP_3': [
    { id: 0, x: 10, y: 5,  w: 80, h: 25 },
    { id: 1, x: 10, y: 35, w: 80, h: 25 },
    { id: 2, x: 10, y: 65, w: 80, h: 25 }
  ]
};

/**
 * Helper to get the correct layout based on frame data
 */
export const getFrameLayout = (frame) => {
  if (!frame) return DEFAULT_LAYOUTS.SINGLE;

  // 1. Check if frame has slots_config from API
  if (frame.slots_config) {
    // Handle stringified JSON from backend
    if (typeof frame.slots_config === 'string') {
      try {
        const parsed = JSON.parse(frame.slots_config);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("[getFrameLayout] Failed to parse slots_config string:", e);
      }
    }
    
    if (Array.isArray(frame.slots_config)) {
      return frame.slots_config;
    }
  }

  // 2. Fallback to hardcoded defaults based on slot count
  if (frame.slots === 4) return DEFAULT_LAYOUTS.GRID_4;
  
  return DEFAULT_LAYOUTS.SINGLE;
};
