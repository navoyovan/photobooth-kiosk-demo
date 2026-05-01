import { useState, useEffect } from 'react';

export const useKioskBoot = () => {
    const [kioskData, setKioskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const bootSequence = async () => {
            try {
                const uuid = localStorage.getItem('kiosk_uuid');
                
                if (!uuid) {
                    throw new Error("UNREGISTERED MACHINE");
                }

                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                const response = await fetch(`${apiUrl}/api/kiosk/boot/${uuid}`);
                
                if (!response.ok) {
                    if (response.status === 404) throw new Error("UNREGISTERED MACHINE");
                    throw new Error("Failed to connect to Master Brain");
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
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        bootSequence();
    }, []);

    return { kioskData, loading, error };
};
