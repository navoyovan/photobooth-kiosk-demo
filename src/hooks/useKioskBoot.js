import { useState, useEffect, useRef } from 'react';
import { getBackendUrl } from '../utils/kioskId';

// Key constants — must match kioskId.js
const STORAGE_KEY_UUID  = 'PHOTOBOOTH_MACHINE_UUID';
const STORAGE_KEY_TOKEN = 'machine_token';
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

export const useKioskBoot = () => {
    const [kioskData, setKioskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const heartbeatRef = useRef(null);

    // ── Heartbeat sender ────────────────────────────────────────────


    useEffect(() => {
        const bootSequence = async () => {
            try {
                // Fixed: was reading 'kiosk_uuid' — now aligned with getMachineUUID() storage key
                const uuid = localStorage.getItem(STORAGE_KEY_UUID);
                
                if (!uuid) {
                    throw new Error("UNREGISTERED MACHINE");
                }

                const apiUrl = getBackendUrl();
                const token  = localStorage.getItem(STORAGE_KEY_TOKEN);
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const response = await fetch(`${apiUrl}/api/kiosk/boot/${uuid}`, { headers });
                
                if (!response.ok) {
                    if (response.status === 401) throw new Error('UNAUTHORIZED — RE-PAIR REQUIRED');
                    if (response.status === 404) throw new Error('UNREGISTERED MACHINE');
                    throw new Error('Failed to connect to Master Brain');
                }

                const data = await response.json();
                
                if (data.frames && data.frames.length > 0) {
                    const preloadPromises = data.frames.map((frame) => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.src = frame.asset_path;
                            img.onload = resolve;
                            img.onerror = reject;
                        });
                    });
                    
                    await Promise.allSettled(preloadPromises);
                }

                setKioskData(data);
                setIsLocked(!!data.is_locked);
                setLoading(false);



            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        bootSequence();

        // Cleanup: stop heartbeat when component unmounts
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, []);

    return { kioskData, loading, error, isLocked };
};
