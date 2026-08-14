export const FRAME_TYPES = [
  // CATEGORY: SPACE (Single Slot Frames)
  { id: 1, name: "MINIMAL_VOID", slots: 1, thumbnail: "/frames/01.jpg", category: "SPACE" },
  { id: 2, name: "PORTRAIT_HUB", slots: 1, thumbnail: "/frames/02.png", category: "SPACE" },
  { id: 4, name: "RAW_CANVAS", slots: 1, thumbnail: "/frames/04.png", category: "SPACE" },
  { id: 5, name: "HYPE_SLOT", slots: 1, thumbnail: "/frames/05.png", category: "SPACE" },
  { id: 6, name: "CYBER_BOUND", slots: 1, thumbnail: "/frames/06.png", category: "SPACE" },
  { id: 7, name: "NEO_PRINT", slots: 1, thumbnail: "/frames/07.png", category: "SPACE" },

  // CATEGORY: GRID (Multi-Slot Collages)
  { id: 101, name: "QUAD_GRID", slots: 4, thumbnail: "/collage/default.png", category: "GRID" },
  { id: 102, name: "PINTEREST_STYLE", slots: 4, thumbnail: "/collage/default.png", category: "GRID" },
];
export const DEFAULT_FRAME = {
  id: 0,
  name: "DEFAULT_FALLBACK",
  slots: 1,
  thumbnail: "/frames/fallback.png",
  category: "FALLBACK",
  isFallback: true
};
