export const FRAME_TYPES = [
  // CATEGORY: SPACE (Single Slot Frames)
  { id: 1, name: "MINIMAL_VOID", slots: 1, thumbnail: "/frames/01.jpg", category: "SPACE" },
  { id: 2, name: "PORTRAIT_HUB", slots: 1, thumbnail: "/frames/02.png", category: "SPACE" },
  { id: 3, name: "MONO_FRAME", slots: 1, thumbnail: "/frames/03.png", category: "SPACE" },
  { id: 4, name: "RAW_CANVAS", slots: 1, thumbnail: "/frames/04.png", category: "SPACE" },
  // { id: 5, name: "HYPE_SLOT", slots: 1, thumbnail: "/frames/05.png", category: "SPACE" },
  { id: 6, name: "CYBER_BOUND", slots: 1, thumbnail: "/frames/06.png", category: "SPACE" },

  // CATEGORY: GRID (Multi-Slot Collages)
  { id: 101, name: "QUAD_GRID", slots: 4, thumbnail: "/collage/1.webp", category: "GRID" },
  // { id: 102, name: "TRIO_STACK", slots: 3, thumbnail: "/collage/2.webp", category: "GRID" },
  // { id: 103, name: "DUO_REEL", slots: 2, thumbnail: "/collage/3.webp", category: "GRID" },
  // { id: 104, name: "BLOCK_VIEW", slots: 4, thumbnail: "/collage/4.webp", category: "GRID" },
  // { id: 105, name: "MATRIX_05", slots: 3, thumbnail: "/collage/5.webp", category: "GRID" },
  // { id: 106, name: "PANEL_HEX", slots: 4, thumbnail: "/collage/6.webp", category: "GRID" },
  // { id: 107, name: "FLOW_07", slots: 2, thumbnail: "/collage/7.webp", category: "GRID" },
  // { id: 108, name: "PRISM_08", slots: 4, thumbnail: "/collage/8.webp", category: "GRID" },
];
export const DEFAULT_FRAME = {
  id: 0,
  name: "DEFAULT_FALLBACK",
  slots: 1,
  thumbnail: "/frames/fallback.png",
  category: "FALLBACK",
  isFallback: true
};
