/**
 * Utility to manage the Kiosk ID in a backend-ready way.
 */

const STORAGE_KEY_ALIAS = 'PHOTOBOOTH_KIOSK_ALIAS';
const STORAGE_KEY_UUID = 'PHOTOBOOTH_MACHINE_UUID';
const STORAGE_KEY_BACKEND = 'PHOTOBOOTH_BACKEND_URL';

// --- CONFIGURATION ---
// Change this to set the default name before the backend is connected
const DEFAULT_KIOSK_ID = "PATIENT-ZER0"; 
const DEFAULT_BACKEND_URL = "http://localhost:8000";

/**
 * Gets the Human-Readable name of this kiosk.
 * Falls back to DEFAULT_KIOSK_ID if nothing is set.
 */
export function getKioskId() {
    return localStorage.getItem(STORAGE_KEY_ALIAS) || DEFAULT_KIOSK_ID;
}

/**
 * Gets a permanent unique fingerprint for this specific hardware/browser.
 * This should be sent to the backend so it knows which machine is asking for its name.
 */
export function getMachineUUID() {
    let uuid = localStorage.getItem(STORAGE_KEY_UUID);
    if (!uuid) {
        // Fallback if crypto.randomUUID is not available (older browsers)
        if (typeof crypto.randomUUID === 'function') {
            uuid = crypto.randomUUID();
        } else {
            uuid = 'UUID-' + Math.random().toString(36).substring(2, 15);
        }
        localStorage.setItem(STORAGE_KEY_UUID, uuid);
    }
    return uuid;
}

/**
 * PLACEHOLDER for your future Backend Integration.
 * You can call this when the app starts.
 */
export async function syncKioskConfig() {
    const machineId = getMachineUUID();
    console.log(`[Kiosk] Machine Fingerprint: ${machineId}`);

    try {
        // FUTURE BACKEND INTEGRATION:
        // const response = await fetch(`https://api.yourbackend.com/kiosk/handshake/${machineId}`);
        // if (response.ok) {
        //    const data = await response.json();
        //    localStorage.setItem(STORAGE_KEY_ALIAS, data.assignedName);
        // }
    } catch (err) {
        console.warn("[Kiosk] Backend sync failed, using local/default ID.");
    }
}

/**
 * Manually sets the Kiosk ID (e.g. for configuration).
 * @param {string} newId 
 */
export function setKioskId(newId) {
    localStorage.setItem(STORAGE_KEY_ALIAS, newId);
}

/**
 * Gets the current configured backend API endpoint.
 */
export function getBackendUrl() {
    return localStorage.getItem(STORAGE_KEY_BACKEND) || DEFAULT_BACKEND_URL;
}

/**
 * Updates the backend API endpoint.
 */
export function setBackendUrl(newUrl) {
    localStorage.setItem(STORAGE_KEY_BACKEND, newUrl);
}
