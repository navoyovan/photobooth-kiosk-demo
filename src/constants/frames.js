export const FRAME_TYPES = [
  // CATEGORY: SPACE (Single Slot Frames)
  {
    id: 1,
    name: "adsadsdasqt",
    slots: 3,
    thumbnail: "/frames/01.png",
    category: "SPACE",
    slots_config: [
      { id: 0, type: "rectangle", x: 8.5, y: 2, w: 32.5, h: 31.5, color: "#FFFFFF", photo_index: 0 },
      { id: 1, type: "rectangle", x: 8.5, y: 34.5, w: 32.5, h: 31.5, color: "#3E4BFF", photo_index: 1 },
      { id: 2, type: "rectangle", x: 8.5, y: 66.5, w: 32.5, h: 31.5, color: "#222222", photo_index: 2 },
      { id: 3, type: "rectangle", x: 57, y: 2, w: 32.5, h: 31.5, color: "#FFFFFF", photo_index: 0 },
      { id: 4, type: "rectangle", x: 57, y: 34, w: 33, h: 32, color: "#3E4BFF", photo_index: 1 },
      { id: 5, type: "rectangle", x: 57, y: 67, w: 32.5, h: 31.5, color: "#222222", photo_index: 2 }
    ]
  },
  {
    id: 2,
    name: "HYPE-",
    slots: 3,
    thumbnail: "/frames/02.png",
    category: "SPACE",
    slots_config: [
      { id: 0, type: "rectangle", x: 52.5, y: 6.5, w: 44.5, h: 19.5, color: "#222222", photo_index: 0 },
      { id: 1, type: "rectangle", x: 53, y: 28, w: 44.5, h: 20.5, color: "#555555", photo_index: 1 },
      { id: 2, type: "rectangle", x: 53, y: 51.5, w: 44.5, h: 18, color: "#AAAAAA", photo_index: 2 },
      { id: 3, type: "rectangle", x: 3.5, y: 72.5, w: 44, h: 20.5, color: "#222222", photo_index: 0 },
      { id: 4, type: "rectangle", x: 3.5, y: 50.5, w: 44, h: 20, color: "#555555", photo_index: 1 },
      { id: 5, type: "rectangle", x: 3, y: 29.5, w: 44, h: 18.5, color: "#AAAAAA", photo_index: 2 }
    ]
  },
  {
    id: 3,
    name: "xbbx",
    slots: 3,
    thumbnail: "/frames/03.png",
    category: "SPACE",
    slots_config: [
      { id: 0, type: "rectangle", x: 22.5, y: 22, w: 55, h: 18.5, color: "#222222", photo_index: 0 },
      { id: 1, type: "rectangle", x: 22.5, y: 40.5, w: 55, h: 19, color: "#FF3E3E", photo_index: 1 },
      { id: 2, type: "rectangle", x: 22.5, y: 59.5, w: 55, h: 18.5, color: "#222222", photo_index: 2 }
    ]
  },
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
