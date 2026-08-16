/**
 * Frame Layout Constants (Percentage-based)
 * x, y, w, h are 0-100 values
 */
export const DEFAULT_LAYOUTS = {
  // 4-Grid Square Collage
  'GRID_4': [
    { id: 0, x: 0, y: 0, w: 50, h: 50 },
    { id: 1, x: 50, y: 0, w: 50, h: 50 },
    { id: 2, x: 0, y: 50, w: 50, h: 50 },
    { id: 3, x: 50, y: 50, w: 50, h: 50 }
  ],

  // Single Full Frame (Space)
  'SINGLE': [
    { id: 0, x: 0, y: 0, w: 100, h: 100 }
  ],

  // 3-Photo Vertical Strip (Example)
  'STRIP_3': [
    { id: 0, x: 10, y: 5, w: 80, h: 25 },
    { id: 1, x: 10, y: 35, w: 80, h: 25 },
    { id: 2, x: 10, y: 65, w: 80, h: 25 }
  ]
};

/**
 * Helper to get the correct layout based on frame data
 */
export const getFrameLayout = (frame) => {
  let layout = DEFAULT_LAYOUTS.SINGLE;

  if (frame && frame.slots_config) {
    let raw = [];
    if (typeof frame.slots_config === 'string') {
      try { raw = JSON.parse(frame.slots_config); } catch (e) { console.error(e); }
    } else if (Array.isArray(frame.slots_config)) {
      raw = frame.slots_config;
    }

    if (Array.isArray(raw) && raw.length > 0) {
      layout = raw;
    }
  } else if (frame && frame.slots === 4) {
    layout = DEFAULT_LAYOUTS.GRID_4;
  }

  if (!Array.isArray(layout)) layout = DEFAULT_LAYOUTS.SINGLE;

  // Normalize: Ensure x, y, w, h exist and handle common aliases (width, height, left, top)
  return layout.map((s, idx) => ({
    id: s.id ?? idx,
    type: s.type ?? 'rectangle',
    x: Number(s.x ?? s.left ?? 0),
    y: Number(s.y ?? s.top ?? 0),
    w: Number(s.w ?? s.width ?? 100),
    h: Number(s.h ?? s.height ?? 100),
    photo_index: s.photo_index !== undefined ? Number(s.photo_index) : undefined,
    path: s.path ?? null,
    viewBox: s.viewBox ?? null,
    color: s.color ?? null,
  }));
};
