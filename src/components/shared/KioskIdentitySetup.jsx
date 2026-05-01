import React, { useState, useEffect } from 'react';

const KioskIdentitySetup = ({ forceShow = false, onClose = null }) => {
    const [uuid, setUuid] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [pairingCode] = useState(() => Math.floor(100000 + Math.random() * 900000));
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const [serverVerified, setServerVerified] = useState('PENDING'); // PENDING | VERIFIED | REJECTED

    useEffect(() => {
        const storedUuid = localStorage.getItem('kiosk_uuid');
        if (storedUuid) {
            setIsConfigured(true);
            setUuid(storedUuid);
            
            // Verify with server
            fetch(`${backendUrl}/api/kiosk/boot/${storedUuid}`)
                .then(res => setServerVerified(res.ok ? 'VERIFIED' : 'REJECTED'))
                .catch(() => setServerVerified('OFFLINE'));
        }
    }, [backendUrl]);

    const handleSave = (e) => {
        e.preventDefault();
        if (uuid.trim()) {
            localStorage.setItem('kiosk_uuid', uuid.trim());
            setIsConfigured(true);
            if (!forceShow) {
                window.location.reload(); 
            } else if (onClose) {
                onClose();
            }
        }
    };

    if (isConfigured && !forceShow) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[99999] font-mono">
            <div className="relative w-full max-w-md">
                {forceShow && onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute -top-12 right-0 text-zinc-500 hover:text-white uppercase tracking-widest text-sm"
                    >
                        [ CLOSE ]
                    </button>
                )}
                
                <div className="bg-[#111] border border-[#333] shadow-2xl p-8 flex flex-col gap-6">
                    <div className="border-b border-[#222] pb-4">
                        <h2 className="text-white text-xl m-0 tracking-widest uppercase">KIOSK DIAGNOSTICS</h2>
                        <div className="flex justify-between mt-2">
                            <span className="text-zinc-500 text-[10px] uppercase">Local Identity:</span>
                            <span className={isConfigured ? 'text-green-500 text-[10px] uppercase font-bold' : 'text-red-500 text-[10px] uppercase font-bold'}>
                                {isConfigured ? '● SAVED' : '○ MISSING'}
                            </span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-zinc-500 text-[10px] uppercase">Server Auth:</span>
                            <span className={
                                serverVerified === 'VERIFIED' ? 'text-green-500 text-[10px] uppercase font-bold' : 
                                serverVerified === 'REJECTED' ? 'text-red-500 text-[10px] uppercase font-bold' : 
                                'text-yellow-500 text-[10px] uppercase font-bold'
                            }>
                                {serverVerified === 'VERIFIED' ? '● AUTHORIZED' : 
                                 serverVerified === 'REJECTED' ? '○ UNRECOGNIZED' : 
                                 '○ ' + serverVerified}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Master Brain Endpoint</span>
                        <code className="text-blue-400 text-xs bg-black/50 p-2 border border-white/5">{backendUrl}</code>
                    </div>

                    <div className="bg-zinc-900/50 p-4 border border-zinc-800 flex flex-col items-center gap-1">
                        <span className="text-zinc-500 text-[10px] uppercase">Pairing Code</span>
                        <span className="text-white text-3xl font-bold tracking-[0.5em]">{pairingCode}</span>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Hardware UUID Override</span>
                            <input 
                                type="text" 
                                value={uuid} 
                                onChange={(e) => setUuid(e.target.value)} 
                                placeholder="ENTER UUID" 
                                className="p-3 bg-black text-white border border-[#444] text-sm outline-none uppercase tracking-widest focus:border-white transition-colors"
                            />
                        </div>
                        <button type="submit" className="p-4 bg-white text-black font-bold border-none cursor-pointer text-sm uppercase tracking-widest hover:bg-zinc-200 transition-colors">
                            UPDATE IDENTITY
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default KioskIdentitySetup;
