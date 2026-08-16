/**
 * Utility to automatically scan transparent cutouts/punchholes in PNG frame overlays
 * and return standard percentage-based slots configuration.
 */

export const PRESET_LAYOUTS = {
  STRIP_3: [
    { id: 0, type: 'rectangle', x: 10, y: 5, w: 80, h: 27, photo_index: 0 },
    { id: 1, type: 'rectangle', x: 10, y: 36.5, w: 80, h: 27, photo_index: 1 },
    { id: 2, type: 'rectangle', x: 10, y: 68, w: 80, h: 27, photo_index: 2 }
  ],
  GRID_4: [
    { id: 0, type: 'rectangle', x: 6, y: 6, w: 42, h: 42, photo_index: 0 },
    { id: 1, type: 'rectangle', x: 52, y: 6, w: 42, h: 42, photo_index: 1 },
    { id: 2, type: 'rectangle', x: 6, y: 52, w: 42, h: 42, photo_index: 2 },
    { id: 3, type: 'rectangle', x: 52, y: 52, w: 42, h: 42, photo_index: 3 }
  ],
  SPLIT_2: [
    { id: 0, type: 'rectangle', x: 10, y: 8, w: 80, h: 40, photo_index: 0 },
    { id: 1, type: 'rectangle', x: 10, y: 52, w: 80, h: 40, photo_index: 1 }
  ]
};

export async function detectPunchholesFromImage(imageSrc, minSizePercent = 4, mode = 'sequential') {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Scale down to a manageable size (max 400px wide) for fast processing
        const scale = Math.min(1, 400 / img.naturalWidth);
        const width = Math.max(10, Math.round(img.naturalWidth * scale));
        const height = Math.max(10, Math.round(img.naturalHeight * scale));

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const visited = new Uint8Array(width * height);
        const boxes = [];

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const alpha = data[idx * 4 + 3];

            // If transparent and not yet visited (alpha threshold <= 45 for feathered edges)
            if (alpha < 45 && !visited[idx]) {
              let minX = x, maxX = x, minY = y, maxY = y;
              const queue = [idx];
              visited[idx] = 1;

              while (queue.length > 0) {
                const curr = queue.pop();
                const cx = curr % width;
                const cy = Math.floor(curr / width);

                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                // 4-directional neighborhood
                const neighbors = [
                  cy > 0 ? curr - width : -1,
                  cy < height - 1 ? curr + width : -1,
                  cx > 0 ? curr - 1 : -1,
                  cx < width - 1 ? curr + 1 : -1
                ];

                for (let i = 0; i < 4; i++) {
                  const n = neighbors[i];
                  if (n !== -1 && !visited[n] && data[n * 4 + 3] < 45) {
                    visited[n] = 1;
                    queue.push(n);
                  }
                }
              }

              const boxW = ((maxX - minX + 1) / width) * 100;
              const boxH = ((maxY - minY + 1) / height) * 100;

              // Filter out tiny transparent specks
              if (boxW >= minSizePercent && boxH >= minSizePercent) {
                // Apply slight overflow/bleed margin (~0.8%) to tuck under opaque frame borders
                const rawX = (minX / width) * 100;
                const rawY = (minY / height) * 100;
                const bleedX = 0.8;
                const bleedY = 0.8;

                const finalX = Math.max(0, rawX - bleedX);
                const finalY = Math.max(0, rawY - bleedY);
                const finalW = Math.min(100 - finalX, boxW + (rawX - finalX) + bleedX);
                const finalH = Math.min(100 - finalY, boxH + (rawY - finalY) + bleedY);

                boxes.push({
                  id: boxes.length,
                  type: 'rectangle',
                  x: Number(finalX.toFixed(1)),
                  y: Number(finalY.toFixed(1)),
                  w: Number(finalW.toFixed(1)),
                  h: Number(finalH.toFixed(1)),
                  photo_index: boxes.length
                });
              }
            }
          }
        }

        if (boxes.length === 0) {
          resolve(null);
          return;
        }

        // Group into vertical columns (tolerance ~6% in X coordinate)
        const columns = [];
        boxes.forEach((box) => {
          const col = columns.find((c) => Math.abs(c[0].x - box.x) <= 6);
          if (col) {
            col.push(box);
          } else {
            columns.push([box]);
          }
        });

        // Sort columns from left to right (X ascending)
        columns.sort((colA, colB) => colA[0].x - colB[0].x);

        // Sort boxes within each column top-to-bottom (Y ascending)
        columns.forEach((col) => col.sort((a, b) => a.y - b.y));

        let formatted = [];

        if (mode === 'twin') {
          // Twin Strip Mode: Every column restarts index from 0, 1, 2... (123... 123...)
          let globalId = 0;
          columns.forEach((col) => {
            col.forEach((box, rowIdx) => {
              formatted.push({
                ...box,
                id: globalId++,
                photo_index: rowIdx
              });
            });
          });
        } else {
          // Sequential Column-First Mode: 0, 1, 2, 3, 4, 5... (1, 2, 3, 4, 5, 6...)
          let globalId = 0;
          columns.forEach((col) => {
            col.forEach((box) => {
              formatted.push({
                ...box,
                id: globalId,
                photo_index: globalId
              });
              globalId++;
            });
          });
        }

        resolve(formatted.length > 0 ? formatted : null);
      } catch (err) {
        console.warn('[punchholeDetector] Failed auto-detection:', err);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };
  });
}
