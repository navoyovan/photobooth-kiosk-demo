import React from 'react';
import styles from './FrameUploadWorkspace.module.css';

const ChromaKeyPanel = ({
  chromaKeyedSrc,
  chromaKeyColor,
  chromaKeyTolerance = 30,
  chromaKeySoftness = 10,
  isEyedropperActive,
  isProcessing,
  onToggleEyedropper,
  onToleranceChange,
  onSoftnessChange,
  onClearChromaKey
}) => {
  return (
    <div className={styles.chromaDirectContainer}>
      {/* Toggle Button for Tapping on Frame */}
      <button
        type="button"
        className={`${styles.chromaToggleBtn} ${isEyedropperActive ? styles.chromaToggleActive : ''} ${chromaKeyedSrc ? styles.chromaHasKey : ''}`}
        onClick={onToggleEyedropper}
        disabled={isProcessing}
      >
        {isProcessing
          ? 'PROCESSING...'
          : isEyedropperActive
          ? 'TAP COLOR ON FRAME'
          : chromaKeyedSrc
          ? 'RE-KEY COLOR'
          : 'SELECT COLOR'}
      </button>

      {/* Dials / Range Sliders */}
      <div className={styles.chromaDialsContainer}>
        {/* Tolerance Dial */}
        <div className={styles.chromaDialRow}>
          <div className={styles.chromaDialHeader}>
            <span className={styles.chromaDialLabel}>Tolerance</span>
            <span className={styles.chromaDialVal}>{chromaKeyTolerance}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="80"
            value={chromaKeyTolerance}
            onChange={(e) => onToleranceChange?.(Number(e.target.value))}
            className={styles.chromaRangeInput}
          />
        </div>

        {/* Feather / Softness Dial */}
        <div className={styles.chromaDialRow}>
          <div className={styles.chromaDialHeader}>
            <span className={styles.chromaDialLabel}>Feather</span>
            <span className={styles.chromaDialVal}>{chromaKeySoftness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={chromaKeySoftness}
            onChange={(e) => onSoftnessChange?.(Number(e.target.value))}
            className={styles.chromaRangeInput}
          />
        </div>
      </div>

      {/* Status / Revert when keyed */}
      {chromaKeyedSrc && (
        <div className={styles.chromaStatusRow}>
          <div className={styles.chromaKeyBadge}>
            <div
              className={styles.chromaColorSwatchSmall}
              style={{ backgroundColor: chromaKeyColor || '#00FF00' }}
            />
            <span className={styles.chromaKeyHex}>{chromaKeyColor || '#00FF00'}</span>
          </div>

          <button
            type="button"
            className={styles.chromaRevertBtn}
            onClick={onClearChromaKey}
            title="Revert to original frame without chroma key"
          >
            REVERT
          </button>
        </div>
      )}
    </div>
  );
};

export default ChromaKeyPanel;
