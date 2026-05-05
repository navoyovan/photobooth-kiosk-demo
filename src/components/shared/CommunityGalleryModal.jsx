import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getCommunityPhotosRaw, deleteCommunityPhoto, clearAllCommunityPhotos } from '../../utils/imageProcessor';
import './hub-modals.css';

const CommunityGalleryModal = ({ isOpen, onClose }) => {
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadPhotos = async () => {
        setIsLoading(true);
        const data = await getCommunityPhotosRaw();
        setPhotos(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadPhotos();
        }
    }, [isOpen]);

    const handleDelete = async (id) => {
        if (window.confirm("DELETE_THIS_ENTRY?")) {
            await deleteCommunityPhoto(id);
            loadPhotos();
        }
    };

    const handleClearAll = async () => {
        if (window.confirm("PURGE_ENTIRE_COMMUNITY_DATABASE? THIS_CANNOT_BE_UNDONE.")) {
            await clearAllCommunityPhotos();
            loadPhotos();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="hub-modal-overlay">
            <div className="hub-modal-backdrop" onClick={onClose}></div>
            
            <div className="hub-modal-container" style={{ maxWidth: '1200px', height: '80vh' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '0.02em', margin: 0 }}>COMMUNITY_MODERATION_HUB</h2>
                        <span className="hub-badge">
                            Total Records: {photos.length} // Capacity: 50
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={handleClearAll}
                            className="hub-modal-btn hub-btn-danger"
                        >
                            PURGE_ALL
                        </button>
                        <button 
                            onClick={onClose}
                            className="hub-modal-btn hub-btn-exit"
                        >
                            [ CLOSE ]
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {isLoading ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
                            QUERYING_INTERNAL_VAULT...
                        </div>
                    ) : photos.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#3f3f46', gap: '1rem' }}>
                            <div style={{ fontSize: '2.25rem' }}>∅</div>
                            <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
                                NO_COMMUNITY_DATA_FOUND<br/>
                                <span style={{ color: '#27272a' }}>VAULT_IS_EMPTY</span>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                            {photos.map((photo) => (
                                <div key={photo.id} style={{ position: 'relative', backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.05)', aspectRatio: '3/4', overflow: 'hidden' }}>
                                    <img 
                                        src={photo.url} 
                                        alt="Donated" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1rem' }}>
                                        <span style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', fontFamily: 'monospace' }}>
                                            ID: {photo.id}<br/><br/>
                                            <span style={{ color: '#a1a1aa' }}>{new Date(photo.timestamp).toLocaleTimeString()}</span>
                                        </span>
                                        <button 
                                            onClick={() => handleDelete(photo.id)}
                                            style={{ backgroundColor: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', padding: '0.5rem 1.5rem', border: '1px solid #ef4444', cursor: 'pointer', fontFamily: '"Neue Machina", sans-serif' }}
                                        >
                                            DELETE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer Deco */}
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#080808', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' }}>
                    <div style={{ color: '#27272a', fontSize: '8px', letterSpacing: '0.5em', whiteSpace: 'nowrap' }}>
                        PRIVACY_PROTECTION_ACTIVE // ALL_EXIF_METADATA_STRIPPED // INTERNAL_STORAGE_ONLY // 
                        PRIVACY_PROTECTION_ACTIVE // ALL_EXIF_METADATA_STRIPPED // INTERNAL_STORAGE_ONLY //
                    </div>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
};

export default CommunityGalleryModal;
