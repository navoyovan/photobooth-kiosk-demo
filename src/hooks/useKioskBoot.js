import { useState } from 'react';

export const useKioskBoot = () => {
    // Standalone offline boot: immediately loaded with zero network dependencies
    const [kioskData] = useState(null);
    const [loading] = useState(false);
    const [error] = useState(null);
    const [isLocked] = useState(false);

    return { kioskData, loading, error, isLocked };
};
