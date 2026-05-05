import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getKioskId, getMachineUUID } from '../../utils/kioskId';
import './hub-modals.css';

const KioskIdentitySetup = ({ forceShow = false, onClose = null }) => {
    const [uuid, setUuid] = useState('');
    const [alias, setAlias] = useState('');
    const [activationCode, setActivationCode] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [feedback, setFeedback] = useState({ type: null, message: '' });
    const [serverVerified, setServerVerified] = useState('PENDING');
    const [portalTarget, setPortalTarget] = useState(null);

    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    useEffect(() => {
        const target = document.getElementById('modal-root');
        setPortalTarget(target);

        if (forceShow) {
            const currentUuid = getMachineUUID();
            const currentAlias = getKioskId();
            setUuid(currentUuid);
            setAlias(currentAlias);

            // Check existing auth status
            const token = localStorage.getItem('machine_token');
            if (token) {
                fetch(`${backendUrl}/api/kiosk/boot/${currentUuid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => setServerVerified(res.ok ? 'VERIFIED' : 'REJECTED'))
                .catch(() => setServerVerified('OFFLINE'));
            } else {
                setServerVerified('UNREGISTERED');
            }
        }
    }, [forceShow, backendUrl]);

    const handleActivate = async () => {
        if (!activationCode || activationCode.length < 4) {
            setFeedback({ type: 'error', message: 'INVALID_KEY_FORMAT' });
            return;
        }

        setIsActivating(true);
        setFeedback({ type: 'info', message: 'COMMUNICATING_WITH_MASTER_BRAIN...' });

        try {
            const response = await fetch(`${backendUrl}/api/kiosk/activate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uuid: uuid,
                    activation_code: activationCode.toUpperCase()
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('machine_token', data.token);
                localStorage.setItem('PHOTOBOOTH_KIOSK_ALIAS', data.readable_id);
                setAlias(data.readable_id);
                setServerVerified('VERIFIED');
                setFeedback({ type: 'success', message: 'ACTIVATION_SUCCESSFUL // REBOOTING_LOGIC...' });
                setTimeout(() => {
                    setFeedback({ type: null, message: '' });
                    if (onClose) onClose();
                }, 2000);
            } else {
                setFeedback({ type: 'error', message: data.message || 'ACTIVATION_REJECTED' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: 'NETWORK_ERROR // LINK_FAILED' });
        } finally {
            setIsActivating(false);
        }
    };

    if (!forceShow) return null;

    const modalContent = (
        <div className="hub-modal-overlay">
            <div className="hub-modal-backdrop"></div>
            <div className="hub-modal-container" style={{ maxWidth: '500px', padding: '2.5rem', gap: '2.5rem' }}>
                {/* Scanner line effect */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '2px',
                    backgroundColor: 'rgba(6,182,212,0.5)', boxShadow: '0 0 15px rgba(6,182,212,0.5)'
                }}></div>
                
                <button 
                    onClick={onClose}
                    className="hub-modal-btn hub-btn-exit"
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
                >
                    [ EXIT_HUB ]
                </button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: serverVerified === 'VERIFIED' ? '#06b6d4' : '#ef4444',
                                boxShadow: serverVerified === 'VERIFIED' ? '0 0 10px #06b6d4' : '0 0 10px #ef4444'
                            }}></div>
                            <h2 className="hub-modal-title" style={{ fontSize: '2rem' }}>
                                CORE_IDENTITY
                            </h2>
                        </div>
                        <p className="hub-modal-subtitle">
                            Diagnostic link established // {serverVerified === 'VERIFIED' ? 'HARDWARE_LINK_AUTHORIZED' : 'STATION_AWAITING_KEY'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ backgroundColor: '#111', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ color: '#71717a', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}>Network Status</span>
                                <span style={{ color: serverVerified === 'VERIFIED' ? '#22d3ee' : '#eab308', fontSize: '12px', fontWeight: 900, fontFamily: 'monospace' }}>
                                    {serverVerified === 'VERIFIED' ? '●_ACTIVE_SECURE' : '○_' + serverVerified}
                                </span>
                            </div>
                            <div style={{ backgroundColor: '#111', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                <span style={{ color: '#71717a', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}>Kiosk Alias</span>
                                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}>{alias}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ color: '#52525b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}>Machine Fingerprint (UUID)</span>
                            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <code style={{ color: 'rgba(6,182,212,0.8)', fontSize: '12px', letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '1rem', fontFamily: 'monospace' }}>{uuid}</code>
                                <span style={{ fontSize: '9px', color: '#71717a', textTransform: 'uppercase', fontWeight: 900, flexShrink: 0 }}>KEY_LOCKED</span>
                            </div>
                        </div>

                        {/* Activation Input */}
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
                            <span style={{ color: '#06b6d4', fontSize: '12px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.3em' }}>Hardware Activation Gateway</span>
                            
                            <div style={{ width: '100%', position: 'relative' }}>
                                <input 
                                    type="text"
                                    value={activationCode}
                                    onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER_ACTIVATION_KEY"
                                    style={{
                                        width: '100%', backgroundColor: '#000', border: '2px solid rgba(255,255,255,0.1)',
                                        padding: '1.25rem', color: '#fff', textAlign: 'center', fontSize: '1.5rem',
                                        fontWeight: 900, letterSpacing: '0.4em', outline: 'none',
                                        transition: 'all 0.2s', boxSizing: 'border-box', fontFamily: 'monospace'
                                    }}
                                    disabled={isActivating || serverVerified === 'VERIFIED'}
                                />
                                {isActivating && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '20px', height: '20px', border: '3px solid #06b6d4', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handleActivate}
                                disabled={isActivating || serverVerified === 'VERIFIED' || !activationCode}
                                className="hub-modal-btn hub-btn-primary"
                                style={{ width: '100%', padding: '1.25rem', fontSize: '16px' }}
                            >
                                {serverVerified === 'VERIFIED' ? 'STATION_ACTIVATED' : 'AUTHORIZE_STATION'}
                            </button>

                            {feedback.message && (
                                <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem', color: feedback.type === 'error' ? '#ef4444' : '#06b6d4', fontFamily: 'monospace' }}>
                                    {feedback.message}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7, transition: 'opacity 0.2s', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#52525b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }}>MASTER_ENDPOINT</span>
                            <code style={{ color: '#a1a1aa', fontSize: '10px', fontFamily: 'monospace' }}>{backendUrl}</code>
                        </div>
                        <button 
                            onClick={() => {
                                if(window.confirm("ARE YOU SURE?")) {
                                    localStorage.clear();
                                    window.location.reload();
                                }
                            }}
                            className="hub-modal-btn hub-btn-danger"
                            style={{ fontSize: '11px', padding: '0.5rem 1rem' }}
                        >
                            FACTORY_RESET
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!portalTarget) return modalContent;
    return createPortal(modalContent, portalTarget);
};

export default KioskIdentitySetup;
