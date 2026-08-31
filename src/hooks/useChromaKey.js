import { useState, useCallback } from 'react';

/**
 * Parses hex color string to RGB object
 */
export function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 255, b: 0 };
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 255, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Converts RGB numbers to Hex color string
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Samples a pixel from an image at (xPercent, yPercent)
 */
export async function samplePixelFromImage(imageSrc, xPercent, yPercent) {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const px = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor((xPercent / 100) * img.naturalWidth)));
        const py = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor((yPercent / 100) * img.naturalHeight)));
        const pixel = ctx.getImageData(px, py, 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        resolve({ r: pixel[0], g: pixel[1], b: pixel[2], hex });
      } catch (err) {
        console.error('[samplePixelFromImage] Error:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
}

/**
 * Process image with chroma key transparency
 * @param {string} sourceSrc - Image URL or base64 data URL
 * @param {string|{r:number, g:number, b:number}} keyColor - Hex or RGB object to key out
 * @param {number} tolerance - 0 to 100 percentage
 * @param {number} softness - 0 to 50 percentage
 * @returns {Promise<string>} - PNG Data URL with transparency applied
 */
export async function processChromaKey(sourceSrc, keyColor, tolerance = 30, softness = 10) {
  return new Promise((resolve, reject) => {
    if (!sourceSrc) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const totalPixels = canvas.width * canvas.height;

        const rgb = typeof keyColor === 'string' ? hexToRgb(keyColor) : keyColor;
        const kr = rgb.r;
        const kg = rgb.g;
        const kb = rgb.b;

        // Max Euclidean distance in RGB is sqrt(255^2 * 3) ≈ 441.67
        const MAX_DIST = 441.67;
        const tolDist = (Math.max(0, Math.min(100, tolerance)) / 100) * MAX_DIST;
        const softDist = (Math.max(0, Math.min(100, softness)) / 100) * MAX_DIST;

        for (let i = 0; i < totalPixels * 4; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip already transparent pixels
          if (a === 0) continue;

          // Euclidean distance to key color
          const dist = Math.sqrt(
            (r - kr) ** 2 +
            (g - kg) ** 2 +
            (b - kb) ** 2
          );

          if (dist <= tolDist) {
            // Completely transparent
            data[i + 3] = 0;
          } else if (softDist > 0 && dist < tolDist + softDist) {
            // Feather edge
            const factor = (dist - tolDist) / softDist;
            data[i + 3] = Math.round(a * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const resultUrl = canvas.toDataURL('image/png');
        resolve(resultUrl);
      } catch (err) {
        console.error('[useChromaKey] Error processing chroma key:', err);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error('[useChromaKey] Failed to load source image:', err);
      reject(err);
    };
  });
}

export function useChromaKey() {
  const [isProcessing, setIsProcessing] = useState(false);

  const applyChromaKey = useCallback(async (sourceSrc, keyColor, tolerance, softness) => {
    setIsProcessing(true);
    try {
      const result = await processChromaKey(sourceSrc, keyColor, tolerance, softness);
      setIsProcessing(false);
      return result;
    } catch (err) {
      setIsProcessing(false);
      throw err;
    }
  }, []);

  return {
    applyChromaKey,
    isProcessing
  };
}
