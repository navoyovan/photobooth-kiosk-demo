import React, { useRef, useState } from 'react';
import { assetUrl } from '../../utils/assetUrl';
import styles from './FrameUploadWorkspace.module.css';

const FrameIngestZone = ({ onImageSelected }) => {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelected(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={styles.ingestContainer}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <div
        className={`${styles.dropzoneBox} ${isDragOver ? styles.dragOver : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="vf-corner tl"></div>
        <div className="vf-corner tr"></div>
        <div className="vf-corner bl"></div>
        <div className="vf-corner br"></div>

        <div className={styles.uploadIconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>

        <div className={styles.dropzoneSub}>TAP TO BROWSE OR DROP FILE</div>

        <div className={styles.specsPill}>
          PNG / WEBP • TRANSPARENT CUTOUTS
        </div>

        <button
          type="button"
          className={styles.tryTutorialBtn}
          onClick={(e) => {
            e.stopPropagation();
            onImageSelected(assetUrl('assets/tutorial.png'), 'tutorial.png');
          }}
        >
          OR TRY TUTORIAL FRAME
        </button>
      </div>
    </div>
  );
};

export default FrameIngestZone;
