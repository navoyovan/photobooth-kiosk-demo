/**
 * Utility for client-side image processing and IndexedDB storage.
 */

const DB_NAME = 'HypeBox_Community';
const STORE_NAME = 'starfield_photos';
const MAX_PHOTOS = 50; 

const openDB = () => {
    return new Promise((resolve, reject) => {
        console.log("[CommunityDB] Opening Connection...");
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            console.log("[CommunityDB] Upgrading Schema...");
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (e) => {
            console.log("[CommunityDB] Connection Established.");
            resolve(e.target.result);
        };
        request.onerror = (e) => {
            console.error("[CommunityDB] Connection Error:", e.target.error);
            reject(e.target.error);
        };
    });
};

export const convertToWebP = async (sourceDataUrl, options = { quality: 0.85 }) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("CANVAS_EXPORT_FAILED"));
            }, 'image/webp', options.quality);
        };
        img.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
        img.src = sourceDataUrl;
    });
};

export const saveToLocalStarfield = async (blob) => {
    console.log("[CommunityDB] Saving Blob of size:", blob.size);
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const addRequest = store.add({
            blob,
            timestamp: Date.now()
        });

        addRequest.onsuccess = () => {
            console.log("[CommunityDB] SAVE_SUCCESS");
            
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                if (countRequest.result > MAX_PHOTOS) {
                    const cursorRequest = store.openCursor();
                    let deleted = 0;
                    const toDelete = countRequest.result - MAX_PHOTOS;
                    cursorRequest.onsuccess = (e) => {
                        const cursor = e.target.result;
                        if (cursor && deleted < toDelete) {
                            store.delete(cursor.primaryKey);
                            deleted++;
                            cursor.continue();
                        }
                    };
                }
            };
            resolve(true);
        };

        addRequest.onerror = (e) => {
            console.error("[CommunityDB] SAVE_ERROR:", e.target.error);
            reject(e.target.error);
        };
    });
};

export const getCommunityPhotoUrls = async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const photos = [];

    return new Promise((resolve) => {
        const request = store.openCursor(null, 'prev');
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                const url = URL.createObjectURL(cursor.value.blob);
                photos.push(url);
                cursor.continue();
            } else {
                console.log("[CommunityDB] Loaded URLs count:", photos.length);
                resolve(photos);
            }
        };
        request.onerror = () => resolve([]);
    });
};

export const getCommunityPhotosRaw = async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const photos = [];

    return new Promise((resolve) => {
        const request = store.openCursor(null, 'prev');
        request.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                photos.push({
                    id: cursor.value.id,
                    url: URL.createObjectURL(cursor.value.blob),
                    timestamp: cursor.value.timestamp
                });
                cursor.continue();
            } else {
                resolve(photos);
            }
        };
        request.onerror = () => resolve([]);
    });
};

export const deleteCommunityPhoto = async (id) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
    });
};

export const clearAllCommunityPhotos = async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
    });
};
