/**
 * assetUrl.js
 *
 * Resolves a public-folder asset path relative to the Vite `base` config.
 *
 * Usage:
 *   import { assetUrl } from '../utils/assetUrl';
 *   <img src={assetUrl('assets/payment_qty.webp')} />
 *
 * In development (base = '/') this returns '/assets/payment_qty.webp'.
 * On GitHub Pages (base = '/photobooth-kiosk-demo/') this returns
 * '/photobooth-kiosk-demo/assets/payment_qty.webp'.
 *
 * @param {string} path - Path relative to the public folder, WITHOUT a leading slash.
 * @returns {string} Fully resolved URL respecting the configured base path.
 */
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL; // always ends with '/'
  return `${base}${path}`;
}
